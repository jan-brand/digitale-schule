-- Campus Foundation v0.1 — M2 Auth-PoC foundations.
--
-- This is a corrective migration (prior migrations already applied to the
-- real instance stay untouched; see 20261014090001 for the pattern).
--
-- Adds the minimum DB-level support needed to actually prove the
-- username+password-without-real-email login pattern (GATE-AUTH /
-- doc/ACCEPTANCE.md POC-01..10), without yet doing the full M3
-- profiles/login_identifiers schema rebuild (still deferred, see
-- doc/DATA_MODEL.md: "DDL wird erst nach Auth-PoC endgültig eingefroren").

create extension if not exists citext;

-- Every school needs a slug for the subdomain-based school context
-- (D-005, doc/ARCHITECTURE.md "URLs der Art https://<slug>.<domain>").
alter table public.schools add column slug citext;

update public.schools set slug = 'demo-a' where id = 'a0000000-0000-0000-0000-000000000001';
update public.schools set slug = 'demo-b' where id = 'a0000000-0000-0000-0000-000000000002';

alter table public.schools alter column slug set not null;
alter table public.schools add constraint schools_slug_key unique (slug);

-- `internal` schema is never exposed via the Data API (only `public` is in
-- Supabase's db_schema config) — stronger isolation than relying on
-- grants within `public` for something this sensitive. No grant to
-- anon/authenticated at all, on the schema or the table.
create schema internal;
revoke all on schema internal from public, anon, authenticated;

-- Maps a (school, normalized username) pair to the synthetic/"technical"
-- email that is actually stored as auth.users.email — the real identity
-- mechanism GoTrue needs internally, never shown to the user and never
-- treated as a real, deliverable address (doc/SECURITY_AUTH.md: "diese
-- niemals als bestätigte Zustelladresse ... behandeln"). Generated once
-- at account-creation time (Edge Function, service_role), never
-- recomputed from a formula — keeps the scheme free to change later
-- without re-deriving every existing identity.
create table internal.login_identifiers (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  username_normalized citext not null,
  technical_email text not null unique,
  created_at timestamptz not null default now(),
  unique (school_id, username_normalized)
);

-- Enforce that a login identifier's school always matches the profile's
-- one-and-only active school_membership (D-004) — a trigger rather than a
-- composite FK, since school_memberships' uniqueness is on user_id alone,
-- not (user_id, school_id).
create function internal.fn_check_login_identifier_school()
returns trigger
language plpgsql
set search_path = public, internal, pg_temp
as $$
begin
  if not exists (
    select 1 from public.school_memberships m
    where m.user_id = new.profile_id and m.school_id = new.school_id
  ) then
    raise exception 'login_identifier_school_mismatch';
  end if;
  return new;
end;
$$;

create trigger check_login_identifier_school
  before insert or update on internal.login_identifiers
  for each row execute function internal.fn_check_login_identifier_school();
