-- Campus Foundation v0.1 — school memberships, roles, role assignments.

create table public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.membership_status not null default 'invited',
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create index school_memberships_user_id_idx on public.school_memberships (user_id);
create index school_memberships_school_id_idx on public.school_memberships (school_id);

-- A membership+school_id pair that FK targets below can reference, so a
-- composite FK can enforce "this row's school_id matches this membership's
-- school_id" directly in the database (see 0004).
create unique index school_memberships_id_school_id_key on public.school_memberships (id, school_id);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code public.role_code not null unique,
  description text
);

insert into public.roles (code, description) values
  ('student', 'Schüler*in'),
  ('teacher', 'Lehrkraft'),
  ('guardian', 'Erziehungsberechtigte*r'),
  ('principal', 'Schulleitung'),
  ('secretary', 'Sekretariat'),
  ('school_admin', 'Schuladministration'),
  ('school_authority', 'Schulträger'),
  ('platform_operator', 'Plattformbetrieb');

create table public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.school_memberships (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  -- v0.1 only activates school-wide scope (doc/DATA_MODEL.md design note);
  -- scope_school_id is required and must match the membership's school_id,
  -- enforced by the composite FK below — this prevents assigning a role
  -- under a different school than the membership belongs to.
  scope_type public.role_scope_type not null default 'school',
  scope_school_id uuid not null,
  membership_school_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (membership_id, membership_school_id)
    references public.school_memberships (id, school_id),
  check (scope_school_id = membership_school_id),
  unique (membership_id, role_id, scope_type, scope_school_id)
);

create index role_assignments_membership_id_idx on public.role_assignments (membership_id);
