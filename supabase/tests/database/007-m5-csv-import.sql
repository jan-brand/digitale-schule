-- M5 CSV-import backend tests (pgTAP), run via `supabase test db`.
-- Covers 20261014240001_m5_csv_import.sql: per-row validation (missing
-- name, disallowed role, unknown class, in-file duplicate), the
-- confirm step's double-execution protection, and that only valid rows
-- are handed back for processing.

begin;
select plan(8);

create or replace function pg_temp.act_as(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- 1) Student cannot stage an import.
select pg_temp.act_as('30000000-0000-0000-0000-0000000000a1');
select throws_ok(
  $$ select public.fn_stage_csv_import('[]'::jsonb, 'test') $$,
  'not_authorized_to_import',
  'A student cannot stage a CSV import'
);

-- 2) Admin A stages a batch with one valid row, one missing-name row,
-- one disallowed-role row, one unknown-class row, and a duplicate of
-- the valid row's name.
select pg_temp.act_as('10000000-0000-0000-0000-00000000000a');
select public.fn_stage_csv_import(
  $$[
    {"first_name":"Lena","last_name":"Beispiel","role_code":"student","class_name":"10a"},
    {"first_name":"","last_name":"NoFirstName","role_code":"student"},
    {"first_name":"Mo","last_name":"Admin","role_code":"school_admin"},
    {"first_name":"Kim","last_name":"Unknown","role_code":"student","class_name":"does-not-exist"},
    {"first_name":"Lena","last_name":"Beispiel","role_code":"student"}
  ]$$::jsonb,
  'bulk onboarding'
) as job_id \gset

select is(
  (select error_code from public.import_job_rows where job_id = :'job_id' and row_number = 2),
  'missing_name',
  'Row 2 (empty first_name) is flagged missing_name'
);
select is(
  (select error_code from public.import_job_rows where job_id = :'job_id' and row_number = 3),
  'role_not_allowed_in_import',
  'Row 3 (school_admin) is rejected — not importable in bulk'
);
select is(
  (select error_code from public.import_job_rows where job_id = :'job_id' and row_number = 4),
  'class_not_found',
  'Row 4 (unknown class) is flagged class_not_found'
);
select is(
  (select error_code from public.import_job_rows where job_id = :'job_id' and row_number = 5),
  'duplicate_in_file',
  'Row 5 (duplicate of row 1''s name) is flagged duplicate_in_file'
);
select is(
  (select validation_state::text from public.import_job_rows where job_id = :'job_id' and row_number = 1),
  'valid',
  'Row 1 (genuinely valid) is marked valid'
);

-- 3) Confirming hands back exactly the one valid row.
--
-- psql's `:'var'` substitution does not fire inside a $$...$$
-- dollar-quoted string (confirmed by direct test) — results_eq/
-- throws_ok take their query as a string executed later *inside* the
-- pgTAP function, so a bare `:'job_id'` there is sent to the server
-- completely unsubstituted, which Postgres's own parser then rejects
-- as a syntax error. format(...) builds the query text instead, with
-- `:'job_id'` substituted by psql *outside* any dollar-quoting, where
-- it still works normally. Found while auditing doc/ACCEPTANCE.md
-- Gate 3 ("CI Staging erfolgreich") — this had silently failed every
-- CI run since this test was written.
select results_eq(
  format($$ select row_number from public.fn_confirm_csv_import(%L::uuid, 'proceeding with import') $$, :'job_id'),
  $$ values (1) $$,
  'fn_confirm_csv_import returns only the valid row'
);

-- 4) A second confirm attempt on the same (now 'importing') job fails —
-- double-execution protection.
select throws_ok(
  format($$ select public.fn_confirm_csv_import(%L::uuid, 'retry attempt') $$, :'job_id'),
  'job_not_in_validated_state',
  'A job already claimed cannot be confirmed a second time'
);

select * from finish();
rollback;
