-- Campus Foundation v0.1 — M4: Benutzerverwaltung backend.
--
-- Adds the privileged, auditable operations the admin UI needs on top of
-- the M3 schema: generating a unique per-school username, finalizing a
-- new member's provisioning (membership + login identifier) once the
-- Edge Function has created their auth.users row, changing a username
-- administratively, and granting/revoking delegated permission_grants.
-- fn_assign_role/fn_revoke_role/fn_update_membership_status (existing,
-- unchanged) remain the only way to touch roles/membership status.

-- ---------------------------------------------------------------------
-- fn_suggest_username: deterministic, per-school-unique suggestion from
-- first/last name. Not exposed to `authenticated` directly — only called
-- from fn_finalize_invite below — so internal.login_identifiers (which
-- doc/DATA_MODEL.md says must have "keinerlei Client SELECT") is never
-- queryable by a client, even indirectly as a raw row set.
-- ---------------------------------------------------------------------

create function internal.fn_suggest_username(p_school_id uuid, p_first_name text, p_last_name text)
returns citext
language plpgsql
stable
set search_path = public, internal, pg_temp
as $$
declare
  v_base text;
  v_candidate citext;
  v_suffix int := 1;
begin
  v_base := lower(p_first_name || '.' || p_last_name);
  v_base := replace(v_base, 'ß', 'ss');
  v_base := translate(v_base, 'äàáâöòóôüùúûñç', 'aaaaooouuuunc');
  v_base := regexp_replace(v_base, '[^a-z0-9.]', '', 'g');
  v_base := regexp_replace(v_base, '\.+', '.', 'g');
  v_base := trim(both '.' from v_base);
  if v_base = '' then
    v_base := 'user';
  end if;

  v_candidate := v_base::citext;
  while exists (
    select 1 from internal.login_identifiers li
    where li.school_id = p_school_id and li.username_normalized = v_candidate
  ) loop
    v_suffix := v_suffix + 1;
    v_candidate := (v_base || v_suffix::text)::citext;
  end loop;

  return v_candidate;
end;
$$;

revoke all on function internal.fn_suggest_username(uuid, text, text) from public;

-- ---------------------------------------------------------------------
-- fn_finalize_invite: called by the admin-invite-user Edge Function
-- AFTER it has already created the auth.users row via the Admin API
-- (with school_id/first_name/last_name in user_metadata, same contract
-- as supabase/functions/auth-provision-user). Creates the
-- school_memberships + internal.login_identifiers rows, generates the
-- username, and audits the creation. Does NOT assign a role — the
-- caller still has to call fn_assign_role separately afterward, so that
-- role assignment keeps going through its own, already-tested,
-- self-escalation/principal-CLI-only checks unchanged.
-- ---------------------------------------------------------------------

create function public.fn_finalize_invite(
  p_new_user_id uuid,
  p_first_name text,
  p_last_name text,
  p_reason text
)
returns table (membership_id uuid, username citext)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_caller public.school_memberships;
  v_school_id uuid;
  v_membership_id uuid;
  v_username citext;
begin
  -- The caller's own school is the only possible target — there is no
  -- cross-school admin role (D-002), so this never takes a school_id
  -- parameter from the client at all.
  select m.school_id into v_school_id
  from public.school_memberships m
  where m.user_id = auth.uid() and m.status = 'active'
  limit 1;

  if v_school_id is null then
    raise exception 'caller_not_an_active_member';
  end if;

  if not (public.fn_is_school_admin(v_school_id) or public.fn_has_permission(v_school_id, 'memberships.invite')) then
    raise exception 'not_authorized_to_invite';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required';
  end if;

  v_caller := public.fn_caller_membership(v_school_id);

  v_username := internal.fn_suggest_username(v_school_id, p_first_name, p_last_name);

  insert into public.school_memberships (school_id, user_id, status, joined_at)
  values (v_school_id, p_new_user_id, 'active', now())
  returning id into v_membership_id;

  insert into internal.login_identifiers (profile_id, school_id, username_normalized, technical_email)
  select p_new_user_id, v_school_id, v_username, u.email
  from auth.users u where u.id = p_new_user_id;

  perform public.fn_write_audit_event(
    v_school_id, 'membership.create', 'school_membership', v_membership_id, p_reason, 'success', v_caller.id
  );

  return query select v_membership_id, v_username;
end;
$$;

revoke all on function public.fn_finalize_invite(uuid, text, text, text) from public;
grant execute on function public.fn_finalize_invite(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- fn_set_username: administrative rename (D-010 — only authorized school
-- administration, never the user themselves). Enforces the same
-- per-school uniqueness as creation time.
-- ---------------------------------------------------------------------

create function public.fn_set_username(p_profile_id uuid, p_new_username citext, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_caller public.school_memberships;
  v_school_id uuid;
  v_normalized citext;
begin
  select school_id into v_school_id from public.profiles where id = p_profile_id;
  if v_school_id is null then
    raise exception 'profile_not_found';
  end if;

  if not public.fn_is_school_admin(v_school_id) then
    raise exception 'not_authorized_to_change_username';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required';
  end if;

  v_caller := public.fn_caller_membership(v_school_id);
  v_normalized := lower(trim(p_new_username::text))::citext;

  if exists (
    select 1 from internal.login_identifiers li
    where li.school_id = v_school_id and li.username_normalized = v_normalized and li.profile_id <> p_profile_id
  ) then
    raise exception 'username_taken';
  end if;

  update internal.login_identifiers set username_normalized = v_normalized where profile_id = p_profile_id;

  perform public.fn_write_audit_event(
    v_school_id, 'profile.username_change', 'profile', p_profile_id, p_reason, 'success', v_caller.id
  );
end;
$$;

revoke all on function public.fn_set_username(uuid, citext, text) from public;
grant execute on function public.fn_set_username(uuid, citext, text) to authenticated;

-- ---------------------------------------------------------------------
-- fn_grant_permission / fn_revoke_permission: the only path that writes
-- permission_grants. Mirrors fn_assign_role's school_admin-delegation
-- shape (D-018, superseding the Permission Matrix's older `principal=D`
-- entry for permissions.grant/revoke): principal can delegate from the
-- fixed catalog without needing the permission itself; school_admin
-- needs the 'permissions.grant' permission already granted to them. No
-- self-grant, mandatory reason, atomic audit.
-- ---------------------------------------------------------------------

create function public.fn_grant_permission(
  p_target_membership_id uuid,
  p_permission_code public.permission_key,
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
  v_permission_id uuid;
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
    raise exception 'self_permission_grant_forbidden';
  end if;

  if not (
    public.fn_has_role(v_school_id, 'principal')
    or (public.fn_is_school_admin(v_school_id) and public.fn_has_permission(v_school_id, 'permissions.grant'))
  ) then
    raise exception 'not_authorized_to_grant_permission';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required';
  end if;

  select id into v_permission_id from public.permissions where code = p_permission_code;

  insert into public.permission_grants (school_id, membership_id, permission_id, issued_by_membership_id, reason)
  values (v_school_id, p_target_membership_id, v_permission_id, v_caller.id, p_reason)
  returning id into v_new_id;

  perform public.fn_write_audit_event(
    v_school_id, 'permission.grant', 'permission_grant', v_new_id, p_reason, 'success', v_caller.id
  );

  return v_new_id;
end;
$$;

revoke all on function public.fn_grant_permission(uuid, public.permission_key, text) from public;
grant execute on function public.fn_grant_permission(uuid, public.permission_key, text) to authenticated;

create function public.fn_revoke_permission(p_permission_grant_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.permission_grants;
  v_caller public.school_memberships;
begin
  select * into v_row from public.permission_grants where id = p_permission_grant_id and revoked_at is null;
  if v_row.id is null then
    raise exception 'permission_grant_not_found_or_already_revoked';
  end if;

  v_caller := public.fn_caller_membership(v_row.school_id);
  if v_caller.id is null then
    raise exception 'caller_not_an_active_member';
  end if;

  if not (
    public.fn_has_role(v_row.school_id, 'principal')
    or (public.fn_is_school_admin(v_row.school_id) and public.fn_has_permission(v_row.school_id, 'permissions.grant'))
  ) then
    raise exception 'not_authorized_to_revoke_permission';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required';
  end if;

  update public.permission_grants set revoked_at = now() where id = p_permission_grant_id;

  perform public.fn_write_audit_event(
    v_row.school_id, 'permission.revoke', 'permission_grant', p_permission_grant_id, p_reason, 'success', v_caller.id
  );
end;
$$;

revoke all on function public.fn_revoke_permission(uuid, text) from public;
grant execute on function public.fn_revoke_permission(uuid, text) to authenticated;
