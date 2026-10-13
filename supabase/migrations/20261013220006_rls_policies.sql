-- Campus Foundation v0.1 — RLS policies, authorization helpers, grants.
--
-- Default deny: RLS is enabled (and forced) on every exposed table, and no
-- privilege is granted to `anon`/`authenticated` beyond what each table's
-- policies actually require (doc/SECURITY.md rules 1+4).
--
-- Privilege-sensitive writes (role/permission grants, membership status
-- changes) go ONLY through the SECURITY DEFINER functions below — there is
-- no direct INSERT/UPDATE grant on school_memberships or role_assignments
-- for `authenticated` at all. This operationalizes
-- doc/CAMPUS_IAM_ACCOUNT_LIFECYCLE_v0_4.md's non-negotiable invariants:
--   IAM-005 / IAM-T09  — no self-escalation, direct or indirect
--   IAM-021            — `principal` is CLI-only, never assignable here
--   IAM-022 / IAM-T04/05 — the last active school_admin can't be removed
--   IAM-023            — critical changes require a reason + atomic audit
-- Delegation granularity beyond this (who exactly may grant which
-- `permission_key`, OPEN-02 in the IAM doc) is intentionally NOT hard-coded
-- here — those permission_grants rows are read, but issuing/revoking them
-- is deferred to Phase F3 pending that open decision.

-- ---------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------

create function public.fn_caller_membership(p_school_id uuid)
returns public.school_memberships
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.* from public.school_memberships m
  where m.school_id = p_school_id
    and m.user_id = auth.uid()
    and m.status = 'active'
  limit 1;
$$;

revoke all on function public.fn_caller_membership(uuid) from public;
grant execute on function public.fn_caller_membership(uuid) to authenticated;

create function public.fn_is_active_school_member(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  -- NOT `exists (select 1 from fn_caller_membership(...))`: a non-SETOF SQL
  -- function used in a FROM clause always yields exactly one row (NULL
  -- composite when the underlying query matched nothing), so that form of
  -- EXISTS is always true. Unwrap the composite's key field instead.
  select (public.fn_caller_membership(p_school_id)).id is not null;
$$;

revoke all on function public.fn_is_active_school_member(uuid) from public;
grant execute on function public.fn_is_active_school_member(uuid) to authenticated;

create function public.fn_has_role(p_school_id uuid, p_role public.role_code)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.role_assignments ra
    join public.school_memberships m on m.id = ra.membership_id
    where m.school_id = p_school_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and ra.role_code = p_role
      and ra.revoked_at is null
  );
$$;

revoke all on function public.fn_has_role(uuid, public.role_code) from public;
grant execute on function public.fn_has_role(uuid, public.role_code) to authenticated;

create function public.fn_is_school_admin(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.fn_has_role(p_school_id, 'school_admin'::public.role_code)
      or public.fn_has_role(p_school_id, 'principal'::public.role_code);
$$;

revoke all on function public.fn_is_school_admin(uuid) from public;
grant execute on function public.fn_is_school_admin(uuid) to authenticated;

create function public.fn_has_permission(p_school_id uuid, p_key public.permission_key)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.permission_grants g
    join public.school_memberships m on m.id = g.membership_id
    where g.school_id = p_school_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and g.permission_key = p_key
      and g.revoked_at is null
  );
$$;

revoke all on function public.fn_has_permission(uuid, public.permission_key) from public;
grant execute on function public.fn_has_permission(uuid, public.permission_key) to authenticated;

create function public.fn_write_audit_event(
  p_school_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_reason text default null,
  p_outcome text default 'success',
  p_actor_membership_id uuid default null
)
returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.audit_events (
    school_id, actor_user_id, actor_membership_id, action, target_type, target_id, reason, outcome
  )
  values (p_school_id, auth.uid(), p_actor_membership_id, p_action, p_target_type, p_target_id, p_reason, p_outcome)
  returning id;
$$;

revoke all on function public.fn_write_audit_event(uuid, text, text, uuid, text, text, uuid) from public;
grant execute on function public.fn_write_audit_event(uuid, text, text, uuid, text, text, uuid) to authenticated;

create function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email, 'Neues Profil'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();

-- Locks the school row (serializing concurrent admin changes, per IAM doc
-- §3 "gesperrte Schulzeile und anschließender Recheck") and raises unless
-- at least one OTHER active school_admin/principal remains for the school
-- (IAM-022, IAM-T04/T05).
create function public.fn_assert_active_admin_remains(p_school_id uuid, p_excluding_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform 1 from public.schools where id = p_school_id for update;

  if not exists (
    select 1
    from public.role_assignments ra
    join public.school_memberships m on m.id = ra.membership_id
    where ra.school_id = p_school_id
      and ra.revoked_at is null
      and ra.role_code in ('school_admin', 'principal')
      and m.status = 'active'
      and ra.membership_id <> p_excluding_membership_id
  ) then
    raise exception 'last_active_admin_required' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.fn_assert_active_admin_remains(uuid, uuid) from public;
-- Not directly callable by clients; only used internally by the functions
-- below (SECURITY DEFINER functions can call it regardless of grants).

-- fn_assign_role: the ONLY way a role_assignments row is created.
-- Enforces: caller must be an active member with sufficient standing;
-- no self-assignment (IAM-005/IAM-T09); `principal` is never assignable
-- here (IAM-021 — CLI-only); `school_admin` requires the caller to be
-- principal, or a school_admin holding the `roles.assign.school_admin`
-- delegation (Permission Matrix); a reason is mandatory and the audit
-- write happens in the same transaction (IAM-023).
create function public.fn_assign_role(
  p_target_membership_id uuid,
  p_role_code public.role_code,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_school_id uuid;
  v_caller public.school_memberships;
  v_new_id uuid;
begin
  select school_id into v_school_id from public.school_memberships where id = p_target_membership_id;
  if v_school_id is null then
    raise exception 'target_membership_not_found';
  end if;

  v_caller := public.fn_caller_membership(v_school_id);
  if v_caller.id is null then
    raise exception 'caller_not_an_active_member';
  end if;

  if v_caller.id = p_target_membership_id then
    raise exception 'self_role_assignment_forbidden';
  end if;

  if p_role_code = 'principal' then
    raise exception 'principal_role_is_cli_only';
  end if;

  if p_role_code = 'school_admin' then
    if not (
      public.fn_has_role(v_school_id, 'principal')
      or (public.fn_has_role(v_school_id, 'school_admin')
          and public.fn_has_permission(v_school_id, 'roles.assign.school_admin'))
    ) then
      raise exception 'not_authorized_to_assign_school_admin';
    end if;
  else
    if not public.fn_is_school_admin(v_school_id) then
      raise exception 'not_authorized_to_assign_role';
    end if;
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required';
  end if;

  insert into public.role_assignments (school_id, membership_id, role_code, assigned_by_membership_id)
  values (v_school_id, p_target_membership_id, p_role_code, v_caller.id)
  returning id into v_new_id;

  perform public.fn_write_audit_event(
    v_school_id, 'role.assign', 'role_assignment', v_new_id, p_reason, 'success', v_caller.id
  );

  return v_new_id;
end;
$$;

revoke all on function public.fn_assign_role(uuid, public.role_code, text) from public;
grant execute on function public.fn_assign_role(uuid, public.role_code, text) to authenticated;

-- fn_revoke_role: the ONLY way a role_assignments row is revoked. Blocks
-- the revoke if it would leave the school without an active admin
-- (IAM-022) and requires a reason (IAM-023).
create function public.fn_revoke_role(p_role_assignment_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.role_assignments;
  v_caller public.school_memberships;
begin
  select * into v_row from public.role_assignments where id = p_role_assignment_id and revoked_at is null;
  if v_row.id is null then
    raise exception 'role_assignment_not_found_or_already_revoked';
  end if;

  v_caller := public.fn_caller_membership(v_row.school_id);
  if v_caller.id is null then
    raise exception 'caller_not_an_active_member';
  end if;

  if not public.fn_is_school_admin(v_row.school_id) then
    raise exception 'not_authorized_to_revoke_role';
  end if;

  if v_row.role_code in ('school_admin', 'principal') then
    perform public.fn_assert_active_admin_remains(v_row.school_id, v_row.membership_id);
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required';
  end if;

  update public.role_assignments set revoked_at = now() where id = p_role_assignment_id;

  perform public.fn_write_audit_event(
    v_row.school_id, 'role.revoke', 'role_assignment', p_role_assignment_id, p_reason, 'success', v_caller.id
  );
end;
$$;

revoke all on function public.fn_revoke_role(uuid, text) from public;
grant execute on function public.fn_revoke_role(uuid, text) to authenticated;

-- fn_update_membership_status: the ONLY way a membership's status changes
-- after creation (invitation acceptance is a separate Phase F3 flow). Blocks
-- suspending/ending a membership if it holds the school's last active
-- admin role (IAM-022).
create function public.fn_update_membership_status(
  p_membership_id uuid,
  p_new_status public.membership_status,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.school_memberships;
  v_caller public.school_memberships;
begin
  select * into v_row from public.school_memberships where id = p_membership_id;
  if v_row.id is null then
    raise exception 'membership_not_found';
  end if;

  v_caller := public.fn_caller_membership(v_row.school_id);
  if v_caller.id is null then
    raise exception 'caller_not_an_active_member';
  end if;

  if not public.fn_is_school_admin(v_row.school_id) then
    raise exception 'not_authorized_to_change_membership_status';
  end if;

  if v_row.status = 'active' and p_new_status <> 'active' then
    perform public.fn_assert_active_admin_remains(v_row.school_id, v_row.id);
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required';
  end if;

  update public.school_memberships
  set status = p_new_status,
      suspended_at = case when p_new_status = 'suspended' then now() else suspended_at end,
      ended_at = case when p_new_status = 'ended' then now() else ended_at end
  where id = p_membership_id;

  perform public.fn_write_audit_event(
    v_row.school_id, 'membership.status_change', 'school_membership', p_membership_id, p_reason, 'success', v_caller.id
  );
end;
$$;

revoke all on function public.fn_update_membership_status(uuid, public.membership_status, text) from public;
grant execute on function public.fn_update_membership_status(uuid, public.membership_status, text) to authenticated;

-- ---------------------------------------------------------------------
-- RLS enablement + grants
-- ---------------------------------------------------------------------

revoke all on all tables in schema public from public, anon, authenticated;
grant usage on schema public to anon, authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'schools', 'school_memberships', 'roles', 'role_permissions',
    'role_assignments', 'permission_grants', 'school_years', 'classes',
    'subjects', 'courses', 'course_memberships', 'class_staff_assignments',
    'module_settings', 'user_preferences', 'school_invitations', 'audit_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- profiles: a user manages only their own profile. No client-side INSERT —
-- rows are created by fn_handle_new_user() on signup.
grant select, update on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- schools: visible only to active members of that school.
grant select on public.schools to authenticated;

create policy schools_select_member on public.schools
  for select to authenticated
  using (public.fn_is_active_school_member(id));

-- school_memberships: a user sees their own memberships; a school_admin
-- or principal sees all memberships in their school. No client-side
-- write grant at all — status changes go only through
-- fn_update_membership_status (invite/accept is a separate Phase F3 flow).
grant select on public.school_memberships to authenticated;

create policy school_memberships_select_own_or_admin on public.school_memberships
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.fn_is_school_admin(school_id)
  );

-- roles / role_permissions: static reference data.
grant select on public.roles to authenticated;
grant select on public.role_permissions to authenticated;

create policy roles_select_all on public.roles for select to authenticated using (true);
create policy role_permissions_select_all on public.role_permissions for select to authenticated using (true);

-- role_assignments: a user sees their own; a school_admin/principal sees
-- their school's. No client-side write grant — only fn_assign_role /
-- fn_revoke_role (SECURITY DEFINER) can write here.
grant select on public.role_assignments to authenticated;

create policy role_assignments_select_own_or_admin on public.role_assignments
  for select to authenticated
  using (
    exists (
      select 1 from public.school_memberships m
      where m.id = role_assignments.membership_id and m.user_id = auth.uid()
    )
    or public.fn_is_school_admin(school_id)
  );

-- permission_grants: a user sees their own grants; a school_admin/principal
-- sees their school's. Issuing/revoking grants is deferred to Phase F3
-- (OPEN-02 in the IAM doc is unresolved) — no write grant for now.
grant select on public.permission_grants to authenticated;

create policy permission_grants_select_own_or_admin on public.permission_grants
  for select to authenticated
  using (
    exists (
      select 1 from public.school_memberships m
      where m.id = permission_grants.membership_id and m.user_id = auth.uid()
    )
    or public.fn_is_school_admin(school_id)
  );

-- school_years / classes / subjects / courses: readable by any active
-- member; writable by that school's school_admin/principal, or by a
-- delegated Secretariat holding the matching permission_key. Not
-- identity-privilege-sensitive, so direct RLS-protected writes are fine
-- here (unlike memberships/roles above).
grant select, insert, update, delete on public.school_years to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.courses to authenticated;

create policy school_years_select_member on public.school_years
  for select to authenticated using (public.fn_is_active_school_member(school_id));
create policy school_years_write_admin on public.school_years
  for all to authenticated
  using (public.fn_is_school_admin(school_id) or public.fn_has_permission(school_id, 'school_years.manage'))
  with check (public.fn_is_school_admin(school_id) or public.fn_has_permission(school_id, 'school_years.manage'));

create policy classes_select_member on public.classes
  for select to authenticated using (public.fn_is_active_school_member(school_id));
create policy classes_write_admin on public.classes
  for all to authenticated
  using (public.fn_is_school_admin(school_id) or public.fn_has_permission(school_id, 'classes.manage'))
  with check (public.fn_is_school_admin(school_id) or public.fn_has_permission(school_id, 'classes.manage'));

create policy subjects_select_member on public.subjects
  for select to authenticated using (public.fn_is_active_school_member(school_id));
create policy subjects_write_admin on public.subjects
  for all to authenticated
  using (public.fn_is_school_admin(school_id))
  with check (public.fn_is_school_admin(school_id));

create policy courses_select_member on public.courses
  for select to authenticated using (public.fn_is_active_school_member(school_id));
create policy courses_write_admin on public.courses
  for all to authenticated
  using (public.fn_is_school_admin(school_id) or public.fn_has_permission(school_id, 'courses.manage'))
  with check (public.fn_is_school_admin(school_id) or public.fn_has_permission(school_id, 'courses.manage'));

-- course_memberships: a user sees their own; a school_admin/principal sees
-- their school's. Writes (enrolling a student/teacher) are admin-only.
grant select, insert, update, delete on public.course_memberships to authenticated;

create policy course_memberships_select_own_or_admin on public.course_memberships
  for select to authenticated
  using (user_id = auth.uid() or public.fn_is_school_admin(school_id));
create policy course_memberships_write_admin on public.course_memberships
  for all to authenticated
  using (public.fn_is_school_admin(school_id))
  with check (public.fn_is_school_admin(school_id));

-- class_staff_assignments (Klassenleitung): readable by any active member
-- of the school; writable by school_admin/principal, or a delegated
-- Secretariat holding class_leadership.assign/.revoke. Whether the target
-- membership is actually an active Teacher is enforced in the Phase F3
-- Edge Function, not by this policy alone.
grant select, insert, update, delete on public.class_staff_assignments to authenticated;

create policy class_staff_assignments_select_member on public.class_staff_assignments
  for select to authenticated using (public.fn_is_active_school_member(school_id));
create policy class_staff_assignments_write_admin on public.class_staff_assignments
  for all to authenticated
  using (
    public.fn_is_school_admin(school_id)
    or public.fn_has_permission(school_id, 'class_leadership.assign')
    or public.fn_has_permission(school_id, 'class_leadership.revoke')
  )
  with check (
    public.fn_is_school_admin(school_id)
    or public.fn_has_permission(school_id, 'class_leadership.assign')
    or public.fn_has_permission(school_id, 'class_leadership.revoke')
  );

-- module_settings: readable by any school member, writable by
-- school_admin/principal or a delegated holder of modules.configure.
grant select, insert, update, delete on public.module_settings to authenticated;

create policy module_settings_select_member on public.module_settings
  for select to authenticated using (public.fn_is_active_school_member(school_id));
create policy module_settings_write_admin on public.module_settings
  for all to authenticated
  using (public.fn_is_school_admin(school_id) or public.fn_has_permission(school_id, 'modules.configure'))
  with check (public.fn_is_school_admin(school_id) or public.fn_has_permission(school_id, 'modules.configure'));

-- user_preferences: strictly own rows only.
grant select, insert, update on public.user_preferences to authenticated;

create policy user_preferences_own on public.user_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- school_invitations: visible to the school's admins/principal only (never
-- the plaintext token — it isn't stored). Issuing/accepting invitations is
-- a full Phase F3 Edge Function flow (IAM doc §5) — no client write grant
-- here yet.
grant select on public.school_invitations to authenticated;

create policy school_invitations_select_admin on public.school_invitations
  for select to authenticated using (public.fn_is_school_admin(school_id));

-- audit_events: no client writes (only fn_write_audit_event, called from
-- the SECURITY DEFINER functions above); a school_admin/principal can read
-- their school's audit trail, nothing else can (IAM doc §9's audit tests;
-- Permission Matrix invariant 10: no normal user may alter/delete audit
-- rows — there is no UPDATE/DELETE grant for anyone but the table owner).
grant select on public.audit_events to authenticated;

create policy audit_events_select_admin on public.audit_events
  for select to authenticated
  using (school_id is not null and public.fn_is_school_admin(school_id));
