-- Campus Foundation v0.1 — M5 (part 2): CSV-Benutzerimport.
--
-- Pipeline: fn_stage_csv_import (parse+validate, pure SQL, no service
-- role needed) -> admin previews import_job_rows (already RLS admin-
-- read-only) -> fn_confirm_csv_import (atomic claim, pure SQL) ->
-- Edge Function admin-import-csv-process does the actual per-row
-- account creation (needs the Admin API, hence service-role, hence an
-- Edge Function) by reusing fn_finalize_invite/fn_assign_role exactly
-- like the single-user invite flow -> fn_record_csv_import_row_result
-- per row -> fn_finish_csv_import_job.
--
-- No passwords in CSV rows at any point (doc brief: "Keine Passwörter
-- in CSV-Dateien") — the Edge Function generates a random initial
-- password per account, same as admin-invite-user.
--
-- Class-roster assignment (linking an imported student to a specific
-- class) is NOT modeled yet — there is no class-membership table in
-- Foundation's current schema (doc/DATA_MODEL.md's table list has no
-- such table; class_staff_assignments is teacher leadership only). CSV
-- rows may reference a class name; it is validated to exist (referential
-- integrity check) but the student is not yet linked to it anywhere
-- persisted — that is M10 schoolorg-UI scope once such a table exists.

alter table public.import_job_rows add column row_data jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------
-- fn_stage_csv_import: parses+validates an already-client-parsed array
-- of rows ({first_name, last_name, role_code, class_name?}), writes one
-- import_job_rows entry per row with its validation outcome. Does not
-- create any accounts.
-- ---------------------------------------------------------------------

create function public.fn_stage_csv_import(p_rows jsonb, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_school_id uuid;
  v_caller public.school_memberships;
  v_job_id uuid;
  v_row jsonb;
  v_idx int := 0;
  v_error_count int := 0;
  v_first_name text;
  v_last_name text;
  v_role_code text;
  v_class_name text;
  v_error text;
  v_seen_names text[] := array[]::text[];
  v_name_key text;
begin
  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'rows_must_be_an_array';
  end if;

  v_school_id := null;
  select m.school_id into v_school_id
  from public.school_memberships m
  where m.user_id = auth.uid() and m.status = 'active'
  limit 1;

  if v_school_id is null then
    raise exception 'caller_not_an_active_member';
  end if;

  if not (public.fn_is_school_admin(v_school_id) or public.fn_has_permission(v_school_id, 'memberships.invite')) then
    raise exception 'not_authorized_to_import';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required';
  end if;

  v_caller := public.fn_caller_membership(v_school_id);

  insert into public.import_jobs (school_id, initiated_by, state, source_metadata, row_count)
  values (v_school_id, v_caller.id, 'pending', jsonb_build_object('reason', p_reason), jsonb_array_length(p_rows))
  returning id into v_job_id;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_idx := v_idx + 1;
    v_error := null;

    v_first_name := trim(coalesce(v_row ->> 'first_name', ''));
    v_last_name := trim(coalesce(v_row ->> 'last_name', ''));
    v_role_code := trim(coalesce(v_row ->> 'role_code', ''));
    v_class_name := nullif(trim(coalesce(v_row ->> 'class_name', '')), '');

    if v_first_name = '' or v_last_name = '' then
      v_error := 'missing_name';
    elsif v_role_code not in ('student', 'teacher', 'parent', 'secretariat') then
      -- school_admin/principal are deliberately never importable in bulk
      -- (principal is CLI-only everywhere; school_admin needs an
      -- individually-reasoned fn_assign_role call, not a CSV row).
      v_error := 'role_not_allowed_in_import';
    elsif v_class_name is not null and not exists (
      select 1 from public.classes c where c.school_id = v_school_id and c.name = v_class_name
    ) then
      v_error := 'class_not_found';
    else
      v_name_key := lower(v_first_name || '|' || v_last_name);
      if v_name_key = any(v_seen_names) then
        v_error := 'duplicate_in_file';
      else
        v_seen_names := array_append(v_seen_names, v_name_key);
      end if;
    end if;

    if v_error is not null then
      v_error_count := v_error_count + 1;
    end if;

    insert into public.import_job_rows (job_id, row_number, validation_state, error_code, row_data)
    values (
      v_job_id, v_idx,
      (case when v_error is null then 'valid' else 'error' end)::public.import_row_validation_state,
      v_error, v_row
    );
  end loop;

  update public.import_jobs
  set state = 'validated', error_count = v_error_count, updated_at = now()
  where id = v_job_id;

  perform public.fn_write_audit_event(
    v_school_id, 'import.stage', 'import_job', v_job_id, p_reason, 'success', v_caller.id
  );

  return v_job_id;
end;
$$;

revoke all on function public.fn_stage_csv_import(jsonb, text) from public;
grant execute on function public.fn_stage_csv_import(jsonb, text) to authenticated;

-- ---------------------------------------------------------------------
-- fn_confirm_csv_import: atomically claims a validated job (protects
-- against double-execution — a second confirm attempt finds state
-- already != 'validated' and is rejected) and hands back the valid rows
-- for the Edge Function to actually process.
-- ---------------------------------------------------------------------

create function public.fn_confirm_csv_import(p_job_id uuid, p_reason text)
returns table (row_number int, first_name text, last_name text, role_code text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.import_jobs;
  v_caller public.school_memberships;
  v_claimed int;
begin
  select * into v_job from public.import_jobs where id = p_job_id;
  if v_job.id is null then
    raise exception 'import_job_not_found';
  end if;

  v_caller := public.fn_caller_membership(v_job.school_id);
  if v_caller.id is null then
    raise exception 'caller_not_an_active_member';
  end if;

  if not (public.fn_is_school_admin(v_job.school_id) or public.fn_has_permission(v_job.school_id, 'memberships.invite')) then
    raise exception 'not_authorized_to_import';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required';
  end if;

  update public.import_jobs set state = 'importing', updated_at = now()
  where id = p_job_id and state = 'validated';
  get diagnostics v_claimed = row_count;

  if v_claimed = 0 then
    raise exception 'job_not_in_validated_state';
  end if;

  perform public.fn_write_audit_event(
    v_job.school_id, 'import.confirm', 'import_job', p_job_id, p_reason, 'success', v_caller.id
  );

  return query
  select r.row_number, r.row_data ->> 'first_name', r.row_data ->> 'last_name', r.row_data ->> 'role_code'
  from public.import_job_rows r
  where r.job_id = p_job_id and r.validation_state = 'valid'
  order by r.row_number;
end;
$$;

revoke all on function public.fn_confirm_csv_import(uuid, text) from public;
grant execute on function public.fn_confirm_csv_import(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- fn_record_csv_import_row_result / fn_finish_csv_import_job: called by
-- the Edge Function once per processed row, and once at the end.
-- ---------------------------------------------------------------------

create function public.fn_record_csv_import_row_result(
  p_job_id uuid,
  p_row_number int,
  p_result_profile_id uuid,
  p_error_code text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_school_id uuid;
begin
  select school_id into v_school_id from public.import_jobs where id = p_job_id;
  if v_school_id is null then
    raise exception 'import_job_not_found';
  end if;
  if not public.fn_is_school_admin(v_school_id) then
    raise exception 'not_authorized_to_import';
  end if;

  update public.import_job_rows
  set validation_state = (case when p_result_profile_id is not null then 'imported' else 'error' end)::public.import_row_validation_state,
      error_code = coalesce(p_error_code, error_code),
      result_account_id = p_result_profile_id
  where job_id = p_job_id and row_number = p_row_number;
end;
$$;

revoke all on function public.fn_record_csv_import_row_result(uuid, int, uuid, text) from public;
grant execute on function public.fn_record_csv_import_row_result(uuid, int, uuid, text) to authenticated;

create function public.fn_finish_csv_import_job(p_job_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job public.import_jobs;
  v_caller public.school_memberships;
  v_error_count int;
begin
  select * into v_job from public.import_jobs where id = p_job_id;
  if v_job.id is null then
    raise exception 'import_job_not_found';
  end if;

  v_caller := public.fn_caller_membership(v_job.school_id);
  if not public.fn_is_school_admin(v_job.school_id) then
    raise exception 'not_authorized_to_import';
  end if;

  select count(*) into v_error_count from public.import_job_rows where job_id = p_job_id and validation_state = 'error';

  update public.import_jobs
  set state = 'completed', error_count = v_error_count, updated_at = now()
  where id = p_job_id;

  perform public.fn_write_audit_event(
    v_job.school_id, 'import.finish', 'import_job', p_job_id, p_reason, 'success', v_caller.id
  );
end;
$$;

revoke all on function public.fn_finish_csv_import_job(uuid, text) from public;
grant execute on function public.fn_finish_csv_import_job(uuid, text) to authenticated;
