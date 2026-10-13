-- Campus Foundation v0.1 — extensions and shared enums.
-- See doc/DATA_MODEL.md for the full data model this schema implements.

create extension if not exists pgcrypto;

-- Fixed system roles (doc/DATA_MODEL.md "Designentscheidungen"). Only the
-- first four (student, teacher, guardian, school_admin) get real
-- functionality in v0.1; the rest are prepared but inactive.
create type public.role_code as enum (
  'student',
  'teacher',
  'guardian',
  'principal',
  'secretary',
  'school_admin',
  'school_authority',
  'platform_operator'
);

create type public.membership_status as enum (
  'active',
  'invited',
  'suspended',
  'revoked'
);

create type public.theme_preference as enum (
  'system',
  'light',
  'dark'
);

-- role_assignments.scope_type is restricted to 'school' for v0.1 (no
-- polymorphic scopes yet, per doc/DATA_MODEL.md's design note).
create type public.role_scope_type as enum (
  'school'
);
