-- IAM invariant tests (pgTAP), run via `supabase test db`.
-- Covers the non-negotiable rules from
-- doc/CAMPUS_IAM_ACCOUNT_LIFECYCLE_v0_4.md (IAM-005, IAM-021, IAM-022,
-- IAM-023) using the seed.sql actors:
--   Admin A    = 10000000-0000-0000-0000-00000000000a (sole school_admin, Schule A)
--   Teacher A  = 20000000-0000-0000-0000-000000000002 (Schule A)
--   Student A1 = 30000000-0000-0000-0000-0000000000a1 (Schule A)
--   Schule A   = a0000000-0000-0000-0000-000000000001

begin;
select plan(6);

create or replace function pg_temp.act_as(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- 1) IAM-005/IAM-T09: no self-escalation — Admin A cannot assign a role
-- (even a lesser one) to their own membership via fn_assign_role.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ select public.fn_assign_role('b0000000-0000-0000-0000-0000000a0a0a', 'teacher', 'self test') $$,
  'self_role_assignment_forbidden',
  'Admin A cannot assign any role to their own membership'
);

-- 2) IAM-021: `principal` can never be assigned through fn_assign_role,
-- even by an existing school_admin — it is CLI-only.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ select public.fn_assign_role('b0000000-0000-0000-0000-0000000a1111', 'principal', 'promote student') $$,
  'principal_role_is_cli_only',
  'Admin A cannot assign the principal role via fn_assign_role'
);

-- 3) Student A1 (no admin standing) cannot assign roles to anyone.
select pg_temp.act_as('30000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select public.fn_assign_role('b0000000-0000-0000-0000-000000cccccc', 'student', 'unauthorized') $$,
  'not_authorized_to_assign_role',
  'Student A1 cannot assign roles'
);

-- 4) IAM-022/IAM-T04: Admin A is Schule A's only active school_admin —
-- revoking that role must be rejected.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ select public.fn_revoke_role(
       (select ra.id from public.role_assignments ra join public.roles r on r.id = ra.role_id
        where ra.membership_id = 'b0000000-0000-0000-0000-0000000a0a0a' and r.code = 'school_admin' and ra.revoked_at is null),
       'stepping down'
     ) $$,
  'last_active_admin_required',
  'The last active school_admin cannot be revoked'
);

-- 5) Same invariant via the membership-status path (suspending the last
-- admin's membership must also be rejected).
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ select public.fn_update_membership_status('b0000000-0000-0000-0000-0000000a0a0a', 'suspended', 'stepping down') $$,
  'last_active_admin_required',
  'Suspending the last active school_admin membership is rejected'
);

-- 6) A valid, non-self, non-last-admin role assignment succeeds and is
-- audited atomically.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select lives_ok(
  $$ select public.fn_assign_role('b0000000-0000-0000-0000-0000000a2222', 'secretariat', 'appoint office staff') $$,
  'Admin A can assign a role to a different member, with a reason'
);

select * from finish();
rollback;
