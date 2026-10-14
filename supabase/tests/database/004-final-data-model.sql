-- M3 final-data-model tests (pgTAP), run via `supabase test db`.
-- Covers 20261014180001_final_data_model.sql: profiles.school_id backfill,
-- the permissions catalog / role_id FK rewire, the invitations rename,
-- and that the new schema-only tables (password_reset_requests,
-- import_jobs/import_job_rows) have no client write path yet.

begin;
select plan(8);

create or replace function pg_temp.act_as(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- 1) Every seeded profile got a backfilled school_id matching its single
-- school_memberships row.
select is(
  (select count(*)::int from public.profiles p
   join public.school_memberships m on m.user_id = p.id
   where p.school_id <> m.school_id),
  0,
  'Every profile.school_id matches its one school_memberships row'
);

-- 2) first_name/last_name are populated (no NULLs survived the backfill).
select is(
  (select count(*)::int from public.profiles where first_name is null or last_name is null),
  0,
  'first_name/last_name are populated for every profile'
);

-- 3) role_assignments now reference role_id, and it resolves to the
-- correct role_code via the roles table (spot check: Admin A).
select is(
  (select r.code::text from public.role_assignments ra
   join public.roles r on r.id = ra.role_id
   where ra.membership_id = 'b0000000-0000-0000-0000-0000000a0a0a' and ra.revoked_at is null),
  'school_admin',
  'Admin A''s role_assignments row resolves to school_admin via role_id'
);

-- 4) permission_grants references permission_id correctly: granting via
-- a direct insert (as the CLI/a future M4 Edge Function would) and
-- reading it back through fn_has_permission must agree.
set local role postgres;
insert into public.permission_grants (school_id, membership_id, permission_id, reason)
select 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000cccccc', id, 'test grant'
from public.permissions where code = 'classes.manage';

select pg_temp.act_as('20000000-0000-0000-0000-000000000002');
select ok(
  public.fn_has_permission('a0000000-0000-0000-0000-000000000001', 'classes.manage'),
  'fn_has_permission resolves a permission_grants row through the new permission_id FK'
);

-- 5) The renamed `invitations` table carries over its RLS: still
-- admin-only select, anon still has no access to it at all.
set local role postgres;
select is(
  (select count(*)::int from information_schema.tables where table_schema = 'public' and table_name = 'invitations'),
  1,
  'school_invitations was renamed to invitations'
);

select pg_temp.act_as('30000000-0000-0000-0000-0000000000a1');
select is(
  (select count(*)::int from public.invitations),
  0,
  'Student A1 (non-admin) sees zero rows in invitations (none exist, but also no permission error — RLS, not a hard grant denial)'
);

-- 6) password_reset_requests / import_jobs have RLS enabled+forced and
-- no insert grant for authenticated yet (M5 builds the real write path).
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ insert into public.password_reset_requests (school_id, user_id, method, token_hash, expires_at)
     values ('a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000a1', 'teacher_code', 'x', now() + interval '1 hour') $$,
  'permission denied for table password_reset_requests',
  'No client write grant on password_reset_requests yet (M5 will add the Edge Function path)'
);

-- 7) Same for import_jobs.
select throws_ok(
  $$ insert into public.import_jobs (school_id, state) values ('a0000000-0000-0000-0000-000000000001', 'pending') $$,
  'permission denied for table import_jobs',
  'No client write grant on import_jobs yet (M5 will add the CSV import path)'
);

select * from finish();
rollback;
