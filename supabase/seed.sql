-- Campus Foundation v0.1 — synthetic seed data (doc/SECURITY.md rule 7:
-- synthetic test data only, no real student/parent data).
--
-- Mirrors doc/DATA_MODEL.md's test-matrix actors:
--   A = Schüler Schule A, B = Schüler Schule B,
--   T = Lehrkraft Schule A, S = Admin Schule A (plus an Admin for Schule B
--   so AC-06 "admin A cannot act in B" is testable).

-- --- schools ---------------------------------------------------------------
-- Must exist before auth.users below: fn_handle_new_user
-- (20261014180001_final_data_model.sql) inserts into profiles with a
-- NOT NULL FK to schools.id, read from each user's metadata at insert
-- time.

insert into public.schools (id, name, status, slug) values
  ('a0000000-0000-0000-0000-000000000001', 'Campus Schule A (Testdaten)', 'active', 'demo-a'),
  ('a0000000-0000-0000-0000-000000000002', 'Campus Schule B (Testdaten)', 'active', 'demo-b');

-- --- synthetic auth.users -------------------------------------------------
-- Password for every seed account: "campus-dev-only" (local/dev use only).
-- raw_user_meta_data carries school_id/first_name/last_name, which
-- fn_handle_new_user reads to populate public.profiles — the same
-- contract supabase/functions/auth-provision-user uses for real account
-- creation.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'u-seed-admin-a@accounts.campus.internal', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"school_id":"a0000000-0000-0000-0000-000000000001","first_name":"Admin","last_name":"A"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'u-seed-admin-b@accounts.campus.internal', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"school_id":"a0000000-0000-0000-0000-000000000002","first_name":"Admin","last_name":"B"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'u-seed-teacher-a@accounts.campus.internal', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"school_id":"a0000000-0000-0000-0000-000000000001","first_name":"Lehrkraft","last_name":"A"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'u-seed-student-a1@accounts.campus.internal', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"school_id":"a0000000-0000-0000-0000-000000000001","first_name":"Schüler","last_name":"A1"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'u-seed-student-a2@accounts.campus.internal', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"school_id":"a0000000-0000-0000-0000-000000000001","first_name":"Schüler","last_name":"A2"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '30000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'u-seed-student-b1@accounts.campus.internal', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"school_id":"a0000000-0000-0000-0000-000000000002","first_name":"Schüler","last_name":"B1"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-0000-0000-00000000000d', 'authenticated', 'authenticated', 'u-seed-parent-a1@accounts.campus.internal', crypt('campus-dev-only', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"school_id":"a0000000-0000-0000-0000-000000000001","first_name":"Elternteil","last_name":"A1"}', now(), now(), '', '');

-- public.profiles rows are created automatically by the on_auth_user_created
-- trigger (fn_handle_new_user, 20261014180001_final_data_model.sql).

-- --- school_memberships ----------------------------------------------------

insert into public.school_memberships (id, school_id, user_id, status, joined_at) values
  ('b0000000-0000-0000-0000-0000000a0a0a', 'a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', 'active', now()), -- Admin A
  ('b0000000-0000-0000-0000-0000000b0b0b', 'a0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000b', 'active', now()), -- Admin B
  ('b0000000-0000-0000-0000-000000cccccc', 'a0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'active', now()), -- Teacher A
  ('b0000000-0000-0000-0000-0000000a1111', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000a1', 'active', now()), -- Student A1
  ('b0000000-0000-0000-0000-0000000a2222', 'a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000a2', 'active', now()), -- Student A2
  ('b0000000-0000-0000-0000-0000000b1111', 'a0000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-0000000000b1', 'active', now()), -- Student B1
  ('b0000000-0000-0000-0000-00000000d111', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-00000000000d', 'active', now()); -- Parent A1

-- --- role_assignments --------------------------------------------------
-- (direct inserts here bypass fn_assign_role — fine for seed data, which
-- runs as the table owner/superuser; real role changes always go through
-- fn_assign_role/fn_revoke_role. role_id is resolved from roles.code
-- since the M3 schema references roles by id, not by code directly.)

insert into public.role_assignments (school_id, membership_id, role_id)
select v.school_id, v.membership_id, r.id
from (values
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-0000000a0a0a'::uuid, 'school_admin'::public.role_code),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-0000000b0b0b'::uuid, 'school_admin'::public.role_code),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000cccccc'::uuid, 'teacher'::public.role_code),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-0000000a1111'::uuid, 'student'::public.role_code),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-0000000a2222'::uuid, 'student'::public.role_code),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-0000000b1111'::uuid, 'student'::public.role_code),
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-00000000d111'::uuid, 'parent'::public.role_code)
) as v(school_id, membership_id, role_code)
join public.roles r on r.code = v.role_code;

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

-- --- login_identifiers (M2) --------------------------------------------
-- Needed for the Auth-PoC's username-login path to work against the
-- seeded accounts too (previously only real provisioned accounts via
-- auth-provision-user had one). Technical email matches each user's
-- actual auth.users.email above.

insert into internal.login_identifiers (profile_id, school_id, username_normalized, technical_email) values
  ('10000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000001', 'admin.a', 'u-seed-admin-a@accounts.campus.internal'),
  ('10000000-0000-0000-0000-00000000000b', 'a0000000-0000-0000-0000-000000000002', 'admin.b', 'u-seed-admin-b@accounts.campus.internal'),
  ('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'teacher.a', 'u-seed-teacher-a@accounts.campus.internal'),
  ('30000000-0000-0000-0000-0000000000a1', 'a0000000-0000-0000-0000-000000000001', 'student.a1', 'u-seed-student-a1@accounts.campus.internal'),
  ('30000000-0000-0000-0000-0000000000a2', 'a0000000-0000-0000-0000-000000000001', 'student.a2', 'u-seed-student-a2@accounts.campus.internal'),
  ('30000000-0000-0000-0000-0000000000b1', 'a0000000-0000-0000-0000-000000000002', 'student.b1', 'u-seed-student-b1@accounts.campus.internal'),
  ('40000000-0000-0000-0000-00000000000d', 'a0000000-0000-0000-0000-000000000001', 'parent.a1', 'u-seed-parent-a1@accounts.campus.internal');
