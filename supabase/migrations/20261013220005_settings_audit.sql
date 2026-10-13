-- Campus Foundation v0.1 — module settings, user preferences, invitations,
-- audit log.

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

-- school_invitations (IAM doc §4.3, §5, §7). The secret invitation proof is
-- stored only as a hash, never in plaintext (IAM doc step 5: "Hash statt
-- Klartext"); the plaintext token is generated and shown/sent exactly once
-- by the issuing Edge Function (Phase F3) and never persisted here.
create table public.school_invitations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  invited_by_membership_id uuid,
  invited_identity_hint text not null,
  proposed_role_codes public.role_code[] not null,
  delivery_method text not null,
  token_hash text not null,
  status public.invitation_status not null default 'draft',
  expires_at timestamptz not null,
  accepted_by_user_id uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (invited_by_membership_id, school_id) references public.school_memberships (id, school_id)
);

create index school_invitations_school_id_idx on public.school_invitations (school_id);
create unique index school_invitations_token_hash_key on public.school_invitations (token_hash);

-- Append-only audit trail (IAM doc §7, Permission Matrix §"Datenmodell-
-- Ergänzungen"). No UPDATE/DELETE grants are given to anon or authenticated
-- (see 0006) — rows are only ever inserted by trusted server-side code via
-- fn_write_audit_event (SECURITY DEFINER). `reason`/`outcome` support
-- IAM-010/IAM-023 ("Pflichtbegründung", atomarer Audit); `metadata` is kept
-- minimal by convention (IAM doc §10: "Audit-Texte... minimieren").
create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  actor_membership_id uuid,
  action text not null,
  target_type text not null,
  target_id uuid,
  reason text,
  outcome text not null default 'success',
  correlation_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index audit_events_school_id_idx on public.audit_events (school_id);
create index audit_events_occurred_at_idx on public.audit_events (occurred_at);
