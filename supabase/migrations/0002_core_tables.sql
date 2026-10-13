-- Campus Foundation v0.1 — identity and tenant core tables.
-- auth.users is Supabase's identity source; profiles.id references it 1:1.
--
-- No `organizations`/Schulträger hierarchy: doc/CAMPUS_IAM_ACCOUNT_LIFECYCLE_v0_4.md
-- §1 removes it explicitly from Foundation scope ("Die frühere
-- organizations-/Schulträgerhierarchie ist nicht Teil von Foundation").
-- One `schools` row = exactly one Campus; no cross-school admin role exists.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data for an auth.users identity. Never store secrets/roles here.';

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
