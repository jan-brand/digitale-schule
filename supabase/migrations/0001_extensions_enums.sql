-- Campus Foundation v0.1 — extensions and shared enums.
-- See doc/DATA_MODEL.md, doc/CAMPUS_PERMISSION_MATRIX_FOUNDATION_v0_3.md and
-- doc/CAMPUS_IAM_ACCOUNT_LIFECYCLE_v0_4.md for the model this implements.

create extension if not exists pgcrypto;

-- Foundation's six standard roles (Permission Matrix §"Standardrollen").
-- No `school_authority` (tied to the removed Schulträger hierarchy) and no
-- `platform_operator`: platform/CLI operators are deliberately NOT a Campus
-- role at all ("Plattformbetrieb / CLI ist technisch separiert, kein
-- normaler Campus-Fachadministrator", IAM doc §1). `principal` exists as a
-- role but — per IAM-021 — can only ever be assigned via the protected
-- operator CLI, never through normal school administration.
create type public.role_code as enum (
  'student',
  'teacher',
  'parent',
  'secretariat',
  'principal',
  'school_admin'
);

-- Campus-membership lifecycle (IAM doc §4.2):
-- invited -> active -> suspended -> active|ended -> archived -> purged.
create type public.membership_status as enum (
  'invited',
  'active',
  'suspended',
  'ended',
  'archived',
  'purged'
);

-- school_invitations lifecycle (IAM doc §4.3).
create type public.invitation_status as enum (
  'draft',
  'pending',
  'accepted',
  'revoked',
  'expired',
  'failed'
);

create type public.theme_preference as enum (
  'system',
  'light',
  'dark'
);

-- Fixed, versioned catalog of delegatable extra permissions (IAM-002;
-- Permission Matrix "fester, versionierter Permission-Katalog"). Only the
-- rights the matrix marks as delegatable ("D") are listed — everything else
-- is covered by a role's standard ("S") rights directly in RLS.
create type public.permission_key as enum (
  'memberships.invite',
  'memberships.suspend',
  'memberships.reactivate',
  'roles.assign.school_admin',
  'permissions.grant',
  'permissions.revoke',
  'class_leadership.assign',
  'class_leadership.revoke',
  'school_years.manage',
  'classes.manage',
  'courses.manage',
  'modules.configure',
  'school_settings.manage'
);
