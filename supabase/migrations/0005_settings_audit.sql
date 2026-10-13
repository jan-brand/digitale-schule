-- Campus Foundation v0.1 — module settings, user preferences, audit log.

create table public.module_settings (
  school_id uuid not null references public.schools (id) on delete cascade,
  module_key text not null,
  enabled boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (school_id, module_key)
);

create table public.user_preferences (
  user_id uuid not null references auth.users (id) on delete cascade,
  school_id uuid references public.schools (id) on delete cascade,
  theme public.theme_preference not null default 'system',
  dashboard_layout jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, school_id)
);

-- Append-only audit trail. No UPDATE/DELETE grants are given to anon or
-- authenticated (see 0006) — rows are only ever inserted by trusted
-- server-side code (Edge Functions / SECURITY DEFINER helpers).
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  subject_type text not null,
  subject_id uuid,
  occurred_at timestamptz not null default now()
);

create index audit_events_school_id_idx on public.audit_events (school_id);
create index audit_events_occurred_at_idx on public.audit_events (occurred_at);
