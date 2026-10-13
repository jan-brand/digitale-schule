-- RLS isolation tests (pgTAP), run via `supabase test db`.
-- Covers doc/DATA_MODEL.md's test matrix using the seed.sql actors:
--   Admin A  = 10000000-0000-0000-0000-00000000000a (Schule A)
--   Admin B  = 10000000-0000-0000-0000-00000000000b (Schule B)
--   Teacher A= 20000000-0000-0000-0000-000000000002 (Schule A)
--   Student A1 = 30000000-0000-0000-0000-0000000000a1 (Schule A)
--   Student B1 = 30000000-0000-0000-0000-0000000000b1 (Schule B)
--   Schule A = a0000000-0000-0000-0000-000000000001
--   Schule B = a0000000-0000-0000-0000-000000000002

begin;
select plan(9);

-- Helper: switch the current transaction's effective user for RLS checks.
create or replace function pg_temp.act_as(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  perform set_config('role', 'authenticated', true);
  set local role authenticated;
end;
$$ language plpgsql;

create or replace function pg_temp.act_as_anon() returns void as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
end;
$$ language plpgsql;

-- 1) Student A1 can see their own school (A).
select pg_temp.act_as('30000000-0000-0000-0000-0000000000a1');
select results_eq(
  $$ select id from public.schools where id = 'a0000000-0000-0000-0000-000000000001' $$,
  $$ values ('a0000000-0000-0000-0000-000000000001'::uuid) $$,
  'Student A1 sees own school (Schule A)'
);

-- 2) Student A1 CANNOT see school B (cross-tenant SELECT denial).
select pg_temp.act_as('30000000-0000-0000-0000-0000000000a1');
select is_empty(
  $$ select id from public.schools where id = 'a0000000-0000-0000-0000-000000000002' $$,
  'Student A1 cannot see Schule B'
);

-- 3) Student A1 CANNOT see Schule B's course rows.
select pg_temp.act_as('30000000-0000-0000-0000-0000000000a1');
select is_empty(
  $$ select id from public.courses where school_id = 'a0000000-0000-0000-0000-000000000002' $$,
  'Student A1 cannot see Schule B courses'
);

-- 4) Student A1 CANNOT insert a class into Schule A (not an admin).
select pg_temp.act_as('30000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ insert into public.classes (school_id, school_year_id, name)
     values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'unauthorized-insert') $$,
  'new row violates row-level security policy for table "classes"',
  'Student A1 cannot create a class even in their own school'
);

-- 5) Admin A CAN insert a class into Schule A.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select lives_ok(
  $$ insert into public.classes (school_id, school_year_id, name)
     values ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'admin-created-class') $$,
  'Admin A can create a class in Schule A'
);

-- 6) Admin A CANNOT insert a class into Schule B (AC-06).
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ insert into public.classes (school_id, school_year_id, name)
     values ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'cross-school-insert') $$,
  'new row violates row-level security policy for table "classes"',
  'Admin A cannot create a class in Schule B'
);

-- 7) Teacher A sees their assigned course membership row.
select pg_temp.act_as('20000000-0000-0000-0000-000000000002');
select isnt_empty(
  $$ select id from public.course_memberships where user_id = '20000000-0000-0000-0000-000000000002' $$,
  'Teacher A sees their own course membership'
);

-- 8) Anonymous clients have no grant on schools at all (stricter than RLS
-- filtering: the query is refused outright, not just filtered to zero rows).
select pg_temp.act_as_anon();
select throws_ok(
  $$ select id from public.schools $$,
  'permission denied for table schools',
  'Anonymous client has no SELECT grant on schools'
);

-- 9) Same for course_memberships.
select pg_temp.act_as_anon();
select throws_ok(
  $$ select id from public.course_memberships $$,
  'permission denied for table course_memberships',
  'Anonymous client has no SELECT grant on course_memberships'
);

select * from finish();
rollback;
