-- Campus Foundation v0.1 — RLS policies, authorization helpers, grants.
--
-- Default deny: RLS is enabled (and forced, so even the table owner is
-- bound by policies) on every exposed table, and no privilege is granted
-- to `anon`/`authenticated` beyond what each table's policies actually
-- require (doc/SECURITY.md, rule 1 and 4).
--
-- All SECURITY DEFINER helpers below set a fixed search_path, revoke
-- EXECUTE from PUBLIC, and grant EXECUTE only to the role that needs it
-- (doc/SECURITY.md, rule 5). They exist so a policy can check membership
-- or role data in OTHER RLS-protected tables without recursing through
-- RLS on those tables.

-- ---------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------

create function public.fn_is_active_school_member(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.school_memberships m
    where m.school_id = p_school_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
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
    join public.roles r on r.id = ra.role_id
    where m.school_id = p_school_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and r.code = p_role
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
  select public.fn_has_role(p_school_id, 'school_admin'::public.role_code);
$$;

revoke all on function public.fn_is_school_admin(uuid) from public;
grant execute on function public.fn_is_school_admin(uuid) to authenticated;

-- Used by privileged Edge Functions (forwarding the caller's JWT) to write
-- an audit row without needing a direct INSERT grant on audit_events.
create function public.fn_write_audit_event(
  p_school_id uuid,
  p_action text,
  p_subject_type text,
  p_subject_id uuid
)
returns uuid
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.audit_events (school_id, actor_user_id, action, subject_type, subject_id)
  values (p_school_id, auth.uid(), p_action, p_subject_type, p_subject_id)
  returning id;
$$;

revoke all on function public.fn_write_audit_event(uuid, text, text, uuid) from public;
grant execute on function public.fn_write_audit_event(uuid, text, text, uuid) to authenticated;

-- Creates the public.profiles row for a new auth.users identity. Runs as
-- SECURITY DEFINER so `authenticated` needs no direct INSERT grant on
-- profiles (closing off a path for a user to insert a profile under
-- someone else's id).
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
    'profiles', 'organizations', 'schools', 'school_memberships', 'roles',
    'role_assignments', 'school_years', 'classes', 'subjects', 'courses',
    'course_memberships', 'module_settings', 'user_preferences', 'audit_events'
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

-- organizations / schools: visible only to members of a school in scope.
grant select on public.organizations to authenticated;
grant select on public.schools to authenticated;

create policy schools_select_member on public.schools
  for select to authenticated
  using (public.fn_is_active_school_member(id));

create policy organizations_select_via_school on public.organizations
  for select to authenticated
  using (
    exists (
      select 1 from public.schools s
      where s.organization_id = organizations.id
        and public.fn_is_active_school_member(s.id)
    )
  );

-- school_memberships: a user sees their own memberships; a school_admin
-- sees all memberships in their school (needed for the admin user list).
-- Writes happen only via privileged Edge Functions using the service role
-- (no INSERT/UPDATE/DELETE grant for `authenticated` here, per
-- doc/SECURITY.md rule 3).
grant select on public.school_memberships to authenticated;

create policy school_memberships_select_own_or_admin on public.school_memberships
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.fn_is_school_admin(school_id)
  );

-- roles: static reference data, readable by any authenticated user.
grant select on public.roles to authenticated;

create policy roles_select_all on public.roles
  for select to authenticated
  using (true);

-- role_assignments: same visibility shape as memberships. Writes are
-- Edge-Function-only (admin-assign-role), never direct client writes.
grant select on public.role_assignments to authenticated;

create policy role_assignments_select_own_or_admin on public.role_assignments
  for select to authenticated
  using (
    exists (
      select 1 from public.school_memberships m
      where m.id = role_assignments.membership_id
        and m.user_id = auth.uid()
    )
    or public.fn_is_school_admin(scope_school_id)
  );

-- school_years / classes / subjects / courses: readable by any active
-- member of the school; writable only by that school's school_admin.
-- Not privilege-escalation-sensitive, so direct RLS-protected writes are
-- fine here (unlike memberships/roles).
grant select, insert, update, delete on public.school_years to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, update, delete on public.courses to authenticated;

create policy school_years_select_member on public.school_years
  for select to authenticated
  using (public.fn_is_active_school_member(school_id));
create policy school_years_write_admin on public.school_years
  for all to authenticated
  using (public.fn_is_school_admin(school_id))
  with check (public.fn_is_school_admin(school_id));

create policy classes_select_member on public.classes
  for select to authenticated
  using (public.fn_is_active_school_member(school_id));
create policy classes_write_admin on public.classes
  for all to authenticated
  using (public.fn_is_school_admin(school_id))
  with check (public.fn_is_school_admin(school_id));

create policy subjects_select_member on public.subjects
  for select to authenticated
  using (public.fn_is_active_school_member(school_id));
create policy subjects_write_admin on public.subjects
  for all to authenticated
  using (public.fn_is_school_admin(school_id))
  with check (public.fn_is_school_admin(school_id));

create policy courses_select_member on public.courses
  for select to authenticated
  using (public.fn_is_active_school_member(school_id));
create policy courses_write_admin on public.courses
  for all to authenticated
  using (public.fn_is_school_admin(school_id))
  with check (public.fn_is_school_admin(school_id));

-- course_memberships: a user sees their own course memberships; a
-- school_admin sees all of them in their school. Writes (enrolling a
-- student/teacher) are school_admin only.
grant select, insert, update, delete on public.course_memberships to authenticated;

create policy course_memberships_select_own_or_admin on public.course_memberships
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.fn_is_school_admin(school_id)
  );
create policy course_memberships_write_admin on public.course_memberships
  for all to authenticated
  using (public.fn_is_school_admin(school_id))
  with check (public.fn_is_school_admin(school_id));

-- module_settings: readable by any school member (so the UI can grey out
-- disabled modules), writable only by that school's school_admin.
grant select, insert, update, delete on public.module_settings to authenticated;

create policy module_settings_select_member on public.module_settings
  for select to authenticated
  using (public.fn_is_active_school_member(school_id));
create policy module_settings_write_admin on public.module_settings
  for all to authenticated
  using (public.fn_is_school_admin(school_id))
  with check (public.fn_is_school_admin(school_id));

-- user_preferences: strictly own rows only.
grant select, insert, update on public.user_preferences to authenticated;

create policy user_preferences_own on public.user_preferences
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- audit_events: no client writes (see fn_write_audit_event above); a
-- school_admin can read their school's audit trail, nothing else can.
grant select on public.audit_events to authenticated;

create policy audit_events_select_admin on public.audit_events
  for select to authenticated
  using (school_id is not null and public.fn_is_school_admin(school_id));
