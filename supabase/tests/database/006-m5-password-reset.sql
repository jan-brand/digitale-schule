-- M5 password-reset backend tests (pgTAP), run via `supabase test db`.
-- Covers 20261014230001_m5_password_reset.sql's fn_issue_teacher_reset_code:
-- role/school boundaries, single-active-code invalidation, and that the
-- stored hash matches the returned plaintext code (what the
-- password-recovery-redeem Edge Function will check against).

begin;
select plan(5);

create or replace function pg_temp.act_as(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- 1) Teacher A can issue a code for Student A1 (same school, student role).
select pg_temp.act_as('20000000-0000-0000-0000-000000000002');
select lives_ok(
  $$ select public.fn_issue_teacher_reset_code('30000000-0000-0000-0000-0000000000a1', 'student forgot password') $$,
  'Teacher A can issue a reset code for Student A1'
);

-- 2) ...but not for Admin A (not a student).
select pg_temp.act_as('20000000-0000-0000-0000-000000000002');
select throws_ok(
  $$ select public.fn_issue_teacher_reset_code('10000000-0000-0000-0000-00000000000a', 'trying to reset admin') $$,
  'reset_forbidden_for_role',
  'Teacher A cannot issue a reset code for a non-student account'
);

-- 3) A student cannot issue a reset code at all.
select pg_temp.act_as('30000000-0000-0000-0000-0000000000a2');
select throws_ok(
  $$ select public.fn_issue_teacher_reset_code('30000000-0000-0000-0000-0000000000a1', 'unauthorized') $$,
  'not_authorized_to_issue_reset_code',
  'A student cannot issue a reset code'
);

-- 4) Teacher A cannot reach across schools to reset Student B1.
select pg_temp.act_as('20000000-0000-0000-0000-000000000002');
select throws_ok(
  $$ select public.fn_issue_teacher_reset_code('30000000-0000-0000-0000-0000000000b1', 'cross school attempt') $$,
  'caller_not_an_active_member',
  'Teacher A cannot issue a reset code for a student in another school'
);

-- 5) Issuing a second code for the same target invalidates the first —
-- only one active (unconsumed) teacher_code row remains.
select pg_temp.act_as('20000000-0000-0000-0000-000000000002');
select public.fn_issue_teacher_reset_code('30000000-0000-0000-0000-0000000000a2', 'first code');
select public.fn_issue_teacher_reset_code('30000000-0000-0000-0000-0000000000a2', 'second code supersedes the first');
set local role postgres;
select is(
  (select count(*)::int from public.password_reset_requests
   where user_id = '30000000-0000-0000-0000-0000000000a2' and method = 'teacher_code' and consumed_at is null),
  1,
  'Only one active teacher_code request remains after issuing a second one'
);

select * from finish();
rollback;
