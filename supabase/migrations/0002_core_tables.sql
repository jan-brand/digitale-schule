-- Campus Foundation v0.1 — identity and tenant core tables.
-- auth.users is Supabase's identity source; profiles.id references it 1:1.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile data for an auth.users identity. Never store secrets/roles here.';

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text,
  created_at timestamptz not null default now()
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete set null,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index schools_organization_id_idx on public.schools (organization_id);
