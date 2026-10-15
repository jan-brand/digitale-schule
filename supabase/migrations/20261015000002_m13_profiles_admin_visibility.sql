-- Campus Foundation v0.1 — M13 (part 2): fix a second real bug found
-- by the same live-browser pass as 20261015000001.
--
-- profiles had exactly one SELECT policy (profiles_select_own,
-- `id = auth.uid()`). PostgREST applies a table's own RLS to it even
-- when the table is reached via an embed (`school_memberships.select(
-- "...,profiles(first_name,last_name)")`), so every admin screen that
-- embeds profiles through school_memberships/class_staff_assignments/
-- class_memberships/course_memberships/permission_grants — the member
-- list, class/course rosters, permission delegations — has always
-- silently returned null for every member except the caller's own row.
-- Confirmed live: admin/users.tsx showed a name only for the admin's
-- own row, blank for every other member, despite the query succeeding
-- and the role/status columns rendering correctly (those don't depend
-- on this embed). Never caught before because verification always
-- went through raw SQL or psql, never actual PostgREST.
--
-- Fix: let a school's admin/principal see every profile in that
-- school, not just their own — this is exactly what SCR-08 ("Liste
-- erlaubter Mitglieder") already assumes is possible.

create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (public.fn_is_school_admin(school_id) or public.fn_has_role(school_id, 'principal'));
