-- Campus Foundation v0.1 — synthetic seed data (doc/SECURITY.md rule 7:
-- synthetic test data only, no real student/parent data).
--
-- Mirrors doc/DATA_MODEL.md's test-matrix actors:
--   A = Schüler Schule A, B = Schüler Schule B,
--   T = Lehrkraft Schule A, S = Admin Schule A (plus an Admin for Schule B
--   so AC-06 "admin A cannot act in B" is testable).

-- --- synthetic auth.users -------------------------------------------------
-- Password for every seed account: "campus-dev-only" (local/dev use only).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'admin.a@campus.test', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Admin Schule A"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'admin.b@campus.test', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Admin Schule B"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'teacher.a@campus.test', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Lehrkraft Schule A"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'student.a1@campus.test', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Schüler A1"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'student.a2@campus.test', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Schüler A2"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'student.b1@campus.test', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Schüler B1"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-0000-0000-00000000000d', 'authenticated', 'authenticated', 'guardian.a1@campus.test', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Erziehungsberechtigte A1"}', now(), now(), '', '');

-- public.profiles rows are created automatically by the on_auth_user_created
-- trigger (0006_rls_policies.sql).

-- --- schools ---------------------------------------------------------------

insert into public.schools (id, name, status) values
  ('a0000000-0000-0000-0000-000000000001', 'Campus Schule A (Testdaten)', 'active'),
  ('a0000000-0000-0000-0000-000000000002', 'Campus Schule B (Testdaten)', 'active');

-- --- school_memberships ----------------------------------------------------

insert into public.school_memberships (id, school_id, user_id, status) values
  ('b0000000-0000-0000-0000-0000000a0a0a', 'a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', 'active'), -- Admin A
  ('b0000000-0000-0000-0000-0000000b0b0b', 'a0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000b', 'active'), -- Admin B
  ('b0000000-0000-0000-0000-000000cccccc', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'active'), -- Teacher A
  ('b0000000-0000-0000-0000-0000000a1111', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000a1', 'active'), -- Student A1
  ('b0000000-0000-0000-0000-0000000a2222', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000a2', 'active'), -- Student A2
  ('b0000000-0000-0000-0000-0000000b1111', 'a0000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-0000000000b1', 'active'), -- Student B1
  ('b0000000-0000-0000-0000-00000000d111', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-00000000000d', 'active'); -- Guardian A1

-- --- role_assignments --------------------------------------------------

insert into public.role_assignments (membership_id, role_id, scope_school_id, membership_school_id)
select m.id, r.id, m.school_id, m.school_id
from public.school_memberships m
join public.roles r on
  (m.id = 'b0000000-0000-0000-0000-0000000a0a0a' and r.code = 'school_admin') or
  (m.id = 'b0000000-0000-0000-0000-0000000b0b0b' and r.code = 'school_admin') or
  (m.id = 'b0000000-0000-0000-0000-000000cccccc' and r.code = 'teacher') or
  (m.id = 'b0000000-0000-0000-0000-0000000a1111' and r.code = 'student') or
  (m.id = 'b0000000-0000-0000-0000-0000000a2222' and r.code = 'student') or
  (m.id = 'b0000000-0000-0000-0000-0000000b1111' and r.code = 'student') or
  (m.id = 'b0000000-0000-0000-0000-00000000d111' and r.code = 'guardian');

-- --- academic structure (Schule A only, enough for smoke tests) -------------

insert into public.school_years (id, school_id, name, starts_on, ends_on) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '2025/2026', '2025-08-01', '2026-07-31');

insert into public.classes (school_id, school_year_id, name) values
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '10a');

insert into public.subjects (id, school_id, name, code) values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Mathematik', 'MATH');

insert into public.courses (id, school_id, school_year_id, subject_id, name) values
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Mathematik 10a');

insert into public.course_memberships (school_id, course_id, user_id, membership_id, membership_school_id, participant_role) values
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000cccccc', 'a0000000-0000-0000-0000-000000000001', 'teacher'),
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000a1', 'b0000000-0000-0000-0000-0000000a1111', 'a0000000-0000-0000-0000-000000000001', 'student');
