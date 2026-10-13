-- Security hotfix regression tests (pgTAP), run via `supabase test db`.
-- Covers the P0 findings from the code review on commit 79ebec4a8a97,
-- fixed in 20261014090001_security_hardening_and_tenant_fix.sql:
--   P0-01 fn_write_audit_event must not be directly callable by clients.
--   P0-02 `principal` role/membership can never be touched by
--         fn_revoke_role / fn_update_membership_status, even by a
--         legitimate school_admin, even when it wouldn't violate the
--         last-admin rule on its own.
--   P0-03 one auth identity can only ever belong to one school.

begin;
select plan(6);

create or replace function pg_temp.act_as(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- Test-only setup: simulate the CLI having already appointed Student A2's
-- membership as `principal` (fn_assign_role itself refuses to ever do
-- this — see 002-iam-invariants.sql IAM-2 — so this has to be inserted
-- directly, exactly as the not-yet-built CLI would via its own trusted
-- path). Rolled back with everything else at the end of this file.
set local role postgres;
insert into public.role_assignments (school_id, membership_id, role_code)
values ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-0000000a2222', 'principal');

-- 1) P0-01: an ordinary authenticated client cannot call
-- fn_write_audit_event directly, even with an innocuous-looking payload.
select pg_temp.act_as('30000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select public.fn_write_audit_event(null, 'fake.action', 'x', null, 'forged', 'success', null) $$,
  'permission denied for function fn_write_audit_event',
  'Authenticated client cannot call fn_write_audit_event directly'
);

-- 2) P0-02a: Admin A (a legitimate school_admin) cannot revoke the
-- principal's role via fn_revoke_role.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ select public.fn_revoke_role(
       (select id from public.role_assignments
        where membership_id = 'b0000000-0000-0000-0000-0000000a2222' and role_code = 'principal' and revoked_at is null),
       'trying to demote principal'
     ) $$,
  'principal_role_is_cli_only',
  'school_admin cannot revoke a principal role'
);

-- 3) P0-02b: Admin A cannot suspend the principal's membership either —
-- the indirect path is blocked the same way as the direct one.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ select public.fn_update_membership_status('b0000000-0000-0000-0000-0000000a2222', 'suspended', 'trying to neuter principal indirectly') $$,
  'principal_membership_status_is_cli_only',
  'school_admin cannot suspend a principal''s membership'
);

-- 4) The legitimate internal audit-writing path (via fn_assign_role) is
-- unaffected by the P0-01 fix — SECURITY DEFINER callers still succeed.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select lives_ok(
  $$ select public.fn_assign_role('b0000000-0000-0000-0000-0000000a1111', 'secretariat', 'appoint office staff') $$,
  'fn_assign_role still writes an audit row internally after the P0-01 fix'
);

-- 5) P0-03: the same auth identity cannot get a second school_memberships
-- row in a different school.
set local role postgres;
select throws_ok(
  $$ insert into public.school_memberships (school_id, user_id, status)
     values ('a0000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-0000000000a1', 'active') $$,
  'duplicate key value violates unique constraint "school_memberships_user_id_key"',
  'An auth identity cannot belong to two schools at once'
);

-- Clean up the test-only principal from setup above: without this, Student
-- A2's membership still counts as a second admin-level role, and test 6
-- below would pass for the wrong reason (another admin remains) rather
-- than the one actually being tested (the single real school_admin is
-- protected on its own).
delete from public.role_assignments
where membership_id = 'b0000000-0000-0000-0000-0000000a2222' and role_code = 'principal';

-- 6) The pre-existing last-admin invariant (IAM-022) still holds after
-- the P0-02 rewrite of fn_revoke_role.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ select public.fn_revoke_role(
       (select id from public.role_assignments
        where membership_id = 'b0000000-0000-0000-0000-0000000a0a0a' and role_code = 'school_admin' and revoked_at is null),
       'stepping down'
     ) $$,
  'last_active_admin_required',
  'Last active school_admin still cannot be revoked after the P0-02 fix'
);

select * from finish();
rollback;
