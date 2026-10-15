-- Campus Foundation v0.1 — school memberships, roles, role assignments,
-- and delegated permission grants.
-- Structure follows doc/CAMPUS_IAM_ACCOUNT_LIFECYCLE_v0_4.md §7 and
-- doc/CAMPUS_PERMISSION_MATRIX_FOUNDATION_v0_3.md §"Datenmodell-Ergänzungen".

create table public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.membership_status not null default 'invited',
  joined_at timestamptz,
  suspended_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create index school_memberships_user_id_idx on public.school_memberships (user_id);
create index school_memberships_school_id_idx on public.school_memberships (school_id);

-- Lets FKs below enforce "this row's school_id matches this membership's
-- school_id" directly in the database.
create unique index school_memberships_id_school_id_key on public.school_memberships (id, school_id);
create unique index school_memberships_user_id_id_key on public.school_memberships (user_id, id);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code public.role_code not null unique,
  description text
);

insert into public.roles (code, description) values
  ('student', 'Schüler*in'),
  ('teacher', 'Lehrkraft'),
  ('parent', 'Elternteil'),
  ('secretariat', 'Sekretariat'),
  ('principal', 'Schulleitung'),
  ('school_admin', 'Schuladministration');

-- role_permissions: catalog of each standard role's "S"-level permissions
-- (Permission Matrix). Used for documentation/introspection; RLS policies
-- still enforce access directly rather than reading this table at runtime.
create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_key public.permission_key not null,
  primary key (role_id, permission_key)
);

create table public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  membership_id uuid not null,
  role_code public.role_code not null,
  assigned_by_membership_id uuid,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  foreign key (membership_id, school_id) references public.school_memberships (id, school_id),
  foreign key (assigned_by_membership_id, school_id) references public.school_memberships (id, school_id)
);

create unique index role_assignments_active_unique
  on public.role_assignments (membership_id, role_code)
  where revoked_at is null;
create index role_assignments_membership_id_idx on public.role_assignments (membership_id);
create index role_assignments_school_id_idx on public.role_assignments (school_id);

-- permission_grants: explicit, revocable delegated extra rights (IAM-002,
-- IAM-008: effective until revoked, void once the membership is inactive).
create table public.permission_grants (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null,
  membership_id uuid not null,
  permission_key public.permission_key not null,
  issued_by_membership_id uuid,
  reason text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  foreign key (membership_id, school_id) references public.school_memberships (id, school_id),
  foreign key (issued_by_membership_id, school_id) references public.school_memberships (id, school_id)
);

create unique index permission_grants_active_unique
  on public.permission_grants (membership_id, permission_key)
  where revoked_at is null;
create index permission_grants_school_id_idx on public.permission_grants (school_id);
