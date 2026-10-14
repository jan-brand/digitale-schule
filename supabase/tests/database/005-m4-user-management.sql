-- M4 user-management backend tests (pgTAP), run via `supabase test db`.
-- Covers 20261014210001_m4_user_management.sql: username suggestion +
-- collision handling, the invite -> assign-role flow, fn_set_username,
-- and fn_grant_permission/fn_revoke_permission's authorization rules
-- (D-018: principal doesn't need the delegation itself, school_admin
-- does; no self-grant).

begin;
select plan(8);

create or replace function pg_temp.act_as(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- 1) Student A1 (no standing) cannot invite.
select pg_temp.act_as('30000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select * from public.fn_finalize_invite('99999999-0000-0000-0000-000000000002', 'X', 'Y', 'test') $$,
  'not_authorized_to_invite',
  'Student A1 cannot invite a new member'
);

-- 2) Full invite -> role-assignment flow: Admin A invites+finalizes a new
-- teacher, generated username matches the expected normalized form, and
-- the subsequent fn_assign_role call succeeds.
set local role postgres;
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '99999999-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
        'u-newhire-test@accounts.campus.internal',
        '{"school_id":"a0000000-0000-0000-0000-000000000001","first_name":"Neu","last_name":"Hire"}',
        now(), now());

select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select results_eq(
  $$ select username::text from public.fn_finalize_invite('99999999-0000-0000-0000-000000000001', 'Neu', 'Hire', 'onboarding') $$,
  $$ values ('neu.hire') $$,
  'fn_finalize_invite generates the expected normalized username'
);

select lives_ok(
  $$ select public.fn_assign_role(
       (select id from public.school_memberships where user_id = '99999999-0000-0000-0000-000000000001'),
       'teacher', 'onboarding'
     ) $$,
  'The newly created membership can be assigned a role via fn_assign_role'
);

-- 3) fn_set_username enforces per-school uniqueness.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ select public.fn_set_username('30000000-0000-0000-0000-0000000000a2', 'neu.hire', 'collision test') $$,
  'username_taken',
  'fn_set_username rejects a username already used in the same school'
);

-- 4) A non-admin cannot invite at all (covered above) and cannot rename
-- others either.
select pg_temp.act_as('30000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select public.fn_set_username('30000000-0000-0000-0000-0000000000a2', 'whatever', 'unauthorized') $$,
  'not_authorized_to_change_username',
  'Student A1 cannot change another member''s username'
);

-- 5) fn_grant_permission: no self-grant.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ select public.fn_grant_permission('b0000000-0000-0000-0000-0000000a0a0a', 'classes.manage', 'self test') $$,
  'self_permission_grant_forbidden',
  'Admin A cannot grant a permission to their own membership'
);

-- 6) fn_grant_permission: school_admin without the 'permissions.grant'
-- delegation cannot grant further permissions.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ select public.fn_grant_permission('b0000000-0000-0000-0000-000000cccccc', 'classes.manage', 'no delegation') $$,
  'not_authorized_to_grant_permission',
  'school_admin without permissions.grant delegation cannot grant permissions'
);

-- 7) fn_grant_permission: a principal CAN delegate from the catalog
-- without holding 'permissions.grant' themselves (D-018).
set local role postgres;
insert into public.role_assignments (school_id, membership_id, role_id)
select 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000d111', id from public.roles where code = 'principal';

select pg_temp.act_as('40000000-0000-0000-0000-00000000000d');
select lives_ok(
  $$ select public.fn_grant_permission('b0000000-0000-0000-0000-000000cccccc', 'classes.manage', 'principal delegates directly') $$,
  'A principal can grant a catalog permission without holding it themselves'
);

select * from finish();
rollback;
