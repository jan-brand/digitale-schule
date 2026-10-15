-- Campus Foundation v0.1 — M16: closes two gaps found while formally
-- auditing doc/ACCEPTANCE.md Gate 2 against the real schema (not just
-- re-reading prior verification notes).
--
-- Gap: "Klassenleitung nur auf eigene zugewiesene Klassen" (D-016:
-- "Klassenleitung = Lehrkraft mit klassenbezogener Zuständigkeit") was
-- never actually wired up. class_memberships_select_own_or_admin
-- (20261014250001_m10_class_rosters.sql) only let a school_admin or the
-- student themselves see a class roster — a teacher assigned as
-- class_staff_assignments.class_leadership for that specific class had
-- no SELECT path at all, not even to their own assigned class. The only
-- alternative was the school-wide `classes.manage` permission, which is
-- far broader than "my own assigned class" and was never meant to
-- stand in for class leadership specifically.
create policy class_memberships_select_class_leader on public.class_memberships
  for select to authenticated
  using (
    exists (
      select 1
      from public.class_staff_assignments csa
      join public.school_memberships m on m.id = csa.membership_id
      where csa.class_id = class_memberships.class_id
        and csa.ended_at is null
        and m.user_id = auth.uid()
        and m.status = 'active'
    )
  );
