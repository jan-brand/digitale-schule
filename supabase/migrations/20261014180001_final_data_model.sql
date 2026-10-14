-- Campus Foundation v0.1 — M3: finales Datenmodell.
--
-- Corrective migration (does not edit already-applied files — same
-- pattern as 20261014090001/20261014150001). doc/DATA_MODEL.md's own
-- header said the schema stays open until the Auth PoC clears ("DDL wird
-- erst nach Auth-PoC endgültig eingefroren") — GATE-AUTH passed (see
-- doc/ACCEPTANCE.md Gate 1), so this finalizes the model to match that
-- doc's table list. Naming decisions confirmed with the user: the doc has
-- deciding power on names (school_invitations -> invitations), and
-- profiles.display_name is replaced outright by first_name/last_name.

-- ---------------------------------------------------------------------
-- profiles: add school_id/first_name/last_name/status, drop display_name
-- ---------------------------------------------------------------------

alter table public.profiles
  add column school_id uuid references public.schools (id) on delete cascade,
  add column first_name text,
  add column last_name text,
  add column status text not null default 'active';

-- Backfill from the existing 1:1 school_memberships row (D-004 already
-- guarantees at most one).
update public.profiles p
set school_id = m.school_id
from public.school_memberships m
where m.user_id = p.id and p.school_id is null;

-- Backfill first/last name from the old display_name for any existing
-- (synthetic) rows — naive split, good enough for test data; accounts
-- created from here on get real first_name/last_name directly (see
-- fn_handle_new_user below).
update public.profiles
set
  first_name = coalesce(split_part(display_name, ' ', 1), 'Unbekannt'),
  last_name = coalesce(nullif(substring(display_name from position(' ' in display_name) + 1), ''), '-')
where first_name is null;

alter table public.profiles
  alter column first_name set not null,
  alter column last_name set not null;

-- Not every profile necessarily has a membership yet at this exact
-- moment in a real system (e.g. mid-provisioning), but every one we have
-- right now does, and app code (fn_handle_new_user) always sets this at
-- creation time going forward — safe to make it mandatory.
alter table public.profiles
  alter column school_id set not null;

alter table public.profiles drop column display_name;

create unique index profiles_school_id_id_key on public.profiles (school_id, id);
create index profiles_school_id_idx on public.profiles (school_id);

-- ---------------------------------------------------------------------
-- roles: add scope/system_managed (doc/DATA_MODEL.md)
-- ---------------------------------------------------------------------

alter table public.roles
  add column scope text not null default 'school',
  add column system_managed boolean not null default true;

-- ---------------------------------------------------------------------
-- permissions: real catalog table replacing the permission_key enum as
-- the FK target for role_permissions/permission_grants. The enum itself
-- stays (it's still the fixed, versioned set of valid codes — doc
-- IAM-002 — permissions.code keeps that type so nothing outside this
-- catalog can be inserted), but role_permissions/permission_grants now
-- reference a stable surrogate id instead of the enum value directly, so
-- the catalog can carry describable metadata (sensitivity,
-- delegation_class) per doc/DATA_MODEL.md.
-- ---------------------------------------------------------------------

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code public.permission_key not null unique,
  sensitivity text not null default 'standard',
  delegation_class text not null default 'standard'
);

insert into public.permissions (code) values
  ('memberships.invite'), ('memberships.suspend'), ('memberships.reactivate'),
  ('roles.assign.school_admin'), ('permissions.grant'), ('permissions.revoke'),
  ('class_leadership.assign'), ('class_leadership.revoke'),
  ('school_years.manage'), ('classes.manage'), ('courses.manage'),
  ('modules.configure'), ('school_settings.manage');

alter table public.role_permissions add column permission_id uuid references public.permissions (id);
update public.role_permissions rp set permission_id = p.id from public.permissions p where p.code = rp.permission_key;
alter table public.role_permissions alter column permission_id set not null;
alter table public.role_permissions drop constraint role_permissions_pkey;
alter table public.role_permissions drop column permission_key;
alter table public.role_permissions add primary key (role_id, permission_id);

alter table public.permission_grants add column permission_id uuid references public.permissions (id);
update public.permission_grants g set permission_id = p.id from public.permissions p where p.code = g.permission_key;
alter table public.permission_grants alter column permission_id set not null;
drop index public.permission_grants_active_unique;
alter table public.permission_grants drop column permission_key;
create unique index permission_grants_active_unique
  on public.permission_grants (membership_id, permission_id)
  where revoked_at is null;

-- ---------------------------------------------------------------------
-- role_assignments: role_id (FK to roles) replaces role_code directly
-- ---------------------------------------------------------------------

alter table public.role_assignments add column role_id uuid references public.roles (id);
update public.role_assignments ra set role_id = r.id from public.roles r where r.code = ra.role_code;
alter table public.role_assignments alter column role_id set not null;
drop index public.role_assignments_active_unique;
alter table public.role_assignments drop column role_code;
create unique index role_assignments_active_unique
  on public.role_assignments (membership_id, role_id)
  where revoked_at is null;

-- ---------------------------------------------------------------------
-- invitations: rename from school_invitations (doc/DATA_MODEL.md naming
-- takes precedence; columns unchanged — the doc's list is a minimum, not
-- a cap). RENAME preserves RLS policies/grants/indexes automatically.
-- ---------------------------------------------------------------------

alter table public.school_invitations rename to invitations;

-- ---------------------------------------------------------------------
-- password_reset_requests / import_jobs / import_job_rows: schema only
-- for now (doc/DATA_MODEL.md) — the issuing/redeeming Edge Functions and
-- the CSV import UI are M5 work. RLS enabled+forced, admin-read-only,
-- exactly like invitations; no client write grant until M5 builds the
-- actual (service-role-mediated) workflows.
-- ---------------------------------------------------------------------

create table public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  initiator_id uuid,
  method text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (initiator_id, school_id) references public.school_memberships (id, school_id)
);
create index password_reset_requests_school_id_idx on public.password_reset_requests (school_id);

create type public.import_job_state as enum ('pending', 'validated', 'importing', 'completed', 'failed');
create type public.import_row_validation_state as enum ('pending', 'valid', 'error', 'imported');

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  initiated_by uuid,
  state public.import_job_state not null default 'pending',
  source_metadata jsonb not null default '{}'::jsonb,
  row_count integer not null default 0,
  error_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (initiated_by, school_id) references public.school_memberships (id, school_id)
);
create index import_jobs_school_id_idx on public.import_jobs (school_id);

create table public.import_job_rows (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.import_jobs (id) on delete cascade,
  row_number integer not null,
  validation_state public.import_row_validation_state not null default 'pending',
  error_code text,
  result_account_id uuid references auth.users (id) on delete set null,
  unique (job_id, row_number)
);
create index import_job_rows_job_id_idx on public.import_job_rows (job_id);

-- ---------------------------------------------------------------------
-- user_preferences: profile_id-only key (one account = one school makes
-- the old (user_id, school_id) composite PK redundant); school_id stays
-- as a plain informational column.
-- ---------------------------------------------------------------------

alter table public.user_preferences drop constraint user_preferences_pkey;
alter table public.user_preferences rename column user_id to profile_id;
alter table public.user_preferences alter column school_id set not null;
alter table public.user_preferences add primary key (profile_id);

-- ---------------------------------------------------------------------
-- RLS: new tables (same policy shape as invitations — admin-read-only).
-- ---------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['permissions', 'password_reset_requests', 'import_jobs', 'import_job_rows']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

grant select on public.permissions to authenticated;
create policy permissions_select_all on public.permissions for select to authenticated using (true);

grant select on public.password_reset_requests to authenticated;
create policy password_reset_requests_select_admin on public.password_reset_requests
  for select to authenticated using (public.fn_is_school_admin(school_id));

grant select on public.import_jobs to authenticated;
create policy import_jobs_select_admin on public.import_jobs
  for select to authenticated using (public.fn_is_school_admin(school_id));

grant select on public.import_job_rows to authenticated;
create policy import_job_rows_select_admin on public.import_job_rows
  for select to authenticated using (
    exists (select 1 from public.import_jobs j where j.id = import_job_rows.job_id and public.fn_is_school_admin(j.school_id))
  );

-- user_preferences policy referenced user_id; recreate for profile_id.
drop policy user_preferences_own on public.user_preferences;
create policy user_preferences_own on public.user_preferences
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------
-- Rewire every function that compared role_code/permission_key directly
-- to join through role_id/permission_id instead. External signatures
-- (parameter types) are UNCHANGED on purpose — every caller (RLS
-- policies, app code) keeps working without modification.
-- ---------------------------------------------------------------------

create or replace function public.fn_has_role(p_school_id uuid, p_role public.role_code)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.role_assignments ra
    join public.school_memberships m on m.id = ra.membership_id
    join public.roles r on r.id = ra.role_id
    where m.school_id = p_school_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and r.code = p_role
      and ra.revoked_at is null
  );
$$;

create or replace function public.fn_has_permission(p_school_id uuid, p_key public.permission_key)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.permission_grants g
    join public.school_memberships m on m.id = g.membership_id
    join public.permissions p on p.id = g.permission_id
    where g.school_id = p_school_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and p.code = p_key
      and g.revoked_at is null
  );
$$;

create or replace function public.fn_assert_active_admin_remains(p_school_id uuid, p_excluding_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform 1 from public.schools where id = p_school_id for update;

  if not exists (
    select 1
    from public.role_assignments ra
    join public.school_memberships m on m.id = ra.membership_id
    join public.roles r on r.id = ra.role_id
    where ra.school_id = p_school_id
      and ra.revoked_at is null
      and r.code in ('school_admin', 'principal')
      and m.status = 'active'
      and ra.membership_id <> p_excluding_membership_id
  ) then
    raise exception 'last_active_admin_required' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.fn_assign_role(
  p_target_membership_id uuid,
  p_role_code public.role_code,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_school_id uuid;
  v_caller public.school_memberships;
  v_role_id uuid;
  v_new_id uuid;
begin
  select school_id into v_school_id from public.school_memberships where id = p_target_membership_id;
  if v_school_id is null then
    raise exception 'target_membership_not_found';
  end if;

  v_caller := public.fn_caller_membership(v_school_id);
  if v_caller.id is null then
    raise exception 'caller_not_an_active_member';
  end if;

  if v_caller.id = p_target_membership_id then
    raise exception 'self_role_assignment_forbidden';
  end if;

  if p_role_code = 'principal' then
    raise exception 'principal_role_is_cli_only';
  end if;

  if p_role_code = 'school_admin' then
    if not (
      public.fn_has_role(v_school_id, 'principal')
      or (public.fn_has_role(v_school_id, 'school_admin')
          and public.fn_has_permission(v_school_id, 'roles.assign.school_admin'))
    ) then
      raise exception 'not_authorized_to_assign_school_admin';
    end if;
  else
    if not public.fn_is_school_admin(v_school_id) then
      raise exception 'not_authorized_to_assign_role';
    end if;
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required';
  end if;

  select id into v_role_id from public.roles where code = p_role_code;

  insert into public.role_assignments (school_id, membership_id, role_id, assigned_by_membership_id)
  values (v_school_id, p_target_membership_id, v_role_id, v_caller.id)
  returning id into v_new_id;

  perform public.fn_write_audit_event(
    v_school_id, 'role.assign', 'role_assignment', v_new_id, p_reason, 'success', v_caller.id
  );

  return v_new_id;
end;
$$;

create or replace function public.fn_revoke_role(p_role_assignment_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.role_assignments;
  v_role_code public.role_code;
  v_caller public.school_memberships;
begin
  select * into v_row from public.role_assignments where id = p_role_assignment_id and revoked_at is null;
  if v_row.id is null then
    raise exception 'role_assignment_not_found_or_already_revoked';
  end if;

  select code into v_role_code from public.roles where id = v_row.role_id;

  if v_role_code = 'principal' then
    raise exception 'principal_role_is_cli_only';
  end if;

  v_caller := public.fn_caller_membership(v_row.school_id);
  if v_caller.id is null then
    raise exception 'caller_not_an_active_member';
  end if;

  if not public.fn_is_school_admin(v_row.school_id) then
    raise exception 'not_authorized_to_revoke_role';
  end if;

  if v_role_code = 'school_admin' then
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

  if exists (
    select 1 from public.role_assignments ra
    join public.roles r on r.id = ra.role_id
    where ra.membership_id = p_membership_id
      and r.code = 'principal'
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

-- ---------------------------------------------------------------------
-- fn_handle_new_user: profiles now need school_id/first_name/last_name
-- at creation time, sourced from auth.users.raw_user_meta_data (the
-- provisioning Edge Function sets these — see
-- supabase/functions/auth-provision-user).
-- ---------------------------------------------------------------------

create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_school_id uuid;
begin
  v_school_id := (new.raw_user_meta_data ->> 'school_id')::uuid;
  if v_school_id is null then
    raise exception 'school_id_required_in_user_metadata';
  end if;

  insert into public.profiles (id, school_id, first_name, last_name)
  values (
    new.id,
    v_school_id,
    coalesce(new.raw_user_meta_data ->> 'first_name', 'Neues'),
    coalesce(new.raw_user_meta_data ->> 'last_name', 'Profil')
  );
  return new;
end;
$$;
