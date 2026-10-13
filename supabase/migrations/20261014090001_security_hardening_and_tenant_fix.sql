-- Campus Foundation v0.1 — security hotfix (code review on commit
-- 79ebec4a8a97). This is a corrective migration, NOT an edit of an
-- already-applied file: the 6 prior migrations have been applied to the
-- real target instance, so they stay as-is and this file only ALTERs what
-- they created.
--
-- P0-01: fn_write_audit_event was EXECUTE-granted to `authenticated` with
-- no authorization check at all — any authenticated client could call it
-- directly and insert arbitrary, falsely-attributed audit_events rows for
-- any school/action/actor_membership_id, defeating audit integrity.
-- Fix: remove the direct grant entirely. It stays callable from
-- fn_assign_role/fn_revoke_role/fn_update_membership_status, because a
-- SECURITY DEFINER function's internal calls are checked against the
-- function OWNER's privileges, not the invoking role's — those callers
-- already do real authorization before writing the audit row, so nothing
-- about their behavior changes.
revoke execute on function public.fn_write_audit_event(
  uuid, text, text, uuid, text, text, uuid
) from authenticated;

-- P0-02: fn_revoke_role only blocked revoking `school_admin`/`principal`
-- when it would leave zero active admins — it did NOT categorically block
-- an ordinary school_admin from revoking an existing `principal`'s role
-- (or, via fn_update_membership_status, suspending/ending a principal's
-- membership) as long as another admin/principal remained. Per the brief:
-- "Entzug der Schulleitungsrolle ausschließlich über die geschützte
-- Campus-CLI" — categorical, not conditional on headcount. Both functions
-- are rebuilt below with an unconditional CLI-only guard for `principal`,
-- on top of (not instead of) the existing last-admin protection.

create or replace function public.fn_revoke_role(p_role_assignment_id uuid, p_reason text)
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

  -- CLI-only, unconditionally (P0-02) — mirrors fn_assign_role's own
  -- refusal to ever assign `principal`.
  if v_row.role_code = 'principal' then
    raise exception 'principal_role_is_cli_only';
  end if;

  v_caller := public.fn_caller_membership(v_row.school_id);
  if v_caller.id is null then
    raise exception 'caller_not_an_active_member';
  end if;

  if not public.fn_is_school_admin(v_row.school_id) then
    raise exception 'not_authorized_to_revoke_role';
  end if;

  if v_row.role_code = 'school_admin' then
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

create or replace function public.fn_update_membership_status(
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

  -- CLI-only, unconditionally (P0-02): a membership currently holding an
  -- active `principal` role cannot have its status changed here at all —
  -- otherwise suspending/ending it would indirectly strip principal
  -- authority without going through the protected CLI.
  if exists (
    select 1 from public.role_assignments ra
    where ra.membership_id = p_membership_id
      and ra.role_code = 'principal'
      and ra.revoked_at is null
  ) then
    raise exception 'principal_membership_status_is_cli_only';
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

-- P0-03: `school_memberships` allowed the same auth identity to hold
-- memberships in more than one school (UNIQUE(school_id, user_id) only
-- prevents a *duplicate* row in the *same* school). The brief's verbindlich
-- model is one account = exactly one school. Verified before writing this
-- migration (see PR description) that no existing row violates the
-- stricter constraint — only synthetic seed data exists, one school each.
alter table public.school_memberships
  drop constraint school_memberships_school_id_user_id_key;

alter table public.school_memberships
  add constraint school_memberships_user_id_key unique (user_id);

comment on constraint school_memberships_user_id_key on public.school_memberships is
  'One auth identity belongs to exactly one school (D-004) — not just one row per school.';
