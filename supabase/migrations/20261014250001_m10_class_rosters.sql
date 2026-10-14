-- Campus Foundation v0.1 — M10: class rosters (student-to-class
-- membership), closing the gap documented in
-- 20261014240001_m5_csv_import.sql: CSV import validated a row's
-- class_name but had nowhere to persist the link. This migration adds
-- that table and wires fn_confirm_csv_import to return class_name so
-- the Edge Function can use it.

create table public.class_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  class_id uuid not null,
  membership_id uuid not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  foreign key (class_id, school_id) references public.classes (id, school_id),
  foreign key (membership_id, school_id) references public.school_memberships (id, school_id)
);

create unique index class_memberships_active_unique
  on public.class_memberships (class_id, membership_id)
  where ended_at is null;
create index class_memberships_class_id_idx on public.class_memberships (class_id);
create index class_memberships_membership_id_idx on public.class_memberships (membership_id);

alter table public.class_memberships enable row level security;
alter table public.class_memberships force row level security;

grant select, insert, update, delete on public.class_memberships to authenticated;

-- Narrower than class_staff_assignments' "any active member can see"
-- (SCR-08 "keine unnötigen privaten Daten"): a full class roster is
-- more sensitive than who teaches it. A student sees their own rows
-- via course_memberships' same user_id=auth.uid() pattern; only an
-- admin/delegated classes.manage holder sees the whole roster.
create policy class_memberships_select_own_or_admin on public.class_memberships
  for select to authenticated
  using (
    public.fn_is_school_admin(school_id)
    or exists (
      select 1 from public.school_memberships m
      where m.id = class_memberships.membership_id and m.user_id = auth.uid()
    )
  );

create policy class_memberships_write_admin on public.class_memberships
  for all to authenticated
  using (public.fn_is_school_admin(school_id) or public.fn_has_permission(school_id, 'classes.manage'))
  with check (public.fn_is_school_admin(school_id) or public.fn_has_permission(school_id, 'classes.manage'));

-- fn_confirm_csv_import now also returns class_name so the Edge
-- Function can resolve+assign a class_memberships row per imported
-- student. Output columns changed, so CREATE OR REPLACE isn't enough —
-- drop and recreate (this is a brand-new migration, not an edit of the
-- one that originally created it).
drop function public.fn_confirm_csv_import(uuid, text);

create function public.fn_confirm_csv_import(p_job_id uuid, p_reason text)
returns table (row_number int, first_name text, last_name text, role_code text, class_name text)
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
  select r.row_number, r.row_data ->> 'first_name', r.row_data ->> 'last_name', r.row_data ->> 'role_code', r.row_data ->> 'class_name'
  from public.import_job_rows r
  where r.job_id = p_job_id and r.validation_state = 'valid'
  order by r.row_number;
end;
$$;

revoke all on function public.fn_confirm_csv_import(uuid, text) from public;
grant execute on function public.fn_confirm_csv_import(uuid, text) to authenticated;
