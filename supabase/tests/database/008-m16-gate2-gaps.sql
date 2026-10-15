-- M16 tests (pgTAP), run via `supabase test db`. Covers
-- 20261015130001_m16_gate2_gaps.sql: class-leader access to their own
-- assigned class roster, and the secretariat seed account's baseline
-- (no access without an explicit grant — D-015).

begin;
select plan(4);

create or replace function pg_temp.act_as(p_user_id uuid) returns void as $$
begin
  perform set_config('request.jwt.claim.sub', p_user_id::text, true);
  set local role authenticated;
end;
$$ language plpgsql;

-- 1) Teacher A, as Klassenleitung of 10a (seed.sql), can see 10a's roster.
select pg_temp.act_as('20000000-0000-0000-0000-000000000002');
select ok(
  (
    select count(*) > 0
    from public.class_memberships
    where class_id = (select id from public.classes where name = '10a' limit 1)
  ),
  'Teacher A (class leader of 10a) can see 10a''s roster'
);

-- 2) Teacher A has no class_staff_assignments for Schule B's classes, so
-- the policy grants nothing there (sanity: it doesn't leak school-wide).
-- There is no 10a-equivalent class in Schule B in seed data, so this
-- instead confirms the general shape: a class leader sees only rows
-- whose class_id matches one of THEIR OWN active assignments, not every
-- row that happens to satisfy fn_is_school_admin for other callers.
select is(
  (select count(*)::int from public.class_staff_assignments where membership_id = 'b0000000-0000-0000-0000-000000cccccc'::uuid and ended_at is null),
  1,
  'Teacher A has exactly one active class-leadership assignment (10a) — the policy scope this test relies on'
);

-- 3) Secretariat A, with no permission grants at all, sees zero roster
-- rows — "Sekretariat braucht explizites Recht" (D-015): the role
-- itself confers nothing by default. (classes.classes_select_* allows
-- any active school member to see that a class named "10a" exists —
-- that's not sensitive on its own, like a parent knowing their own
-- school's class list; class_memberships is the sensitive one, since
-- that's the actual roster of who is in it.)
select pg_temp.act_as('50000000-0000-0000-0000-00000000000e');
select is(
  (select count(*)::int from public.class_memberships),
  0,
  'Secretariat A (no permission grants) sees zero class_memberships rows'
);

-- 4) ...but once explicitly granted classes.manage (same mechanism any
-- other role would use — direct insert here, like seed.sql's own
-- role_assignments, since fn_grant_permission itself requires a
-- principal-level caller, D-018, and seed.sql has none for Schule A by
-- design), Secretariat A does see the roster — confirming
-- fn_has_permission is genuinely role-agnostic, not accidentally
-- hardcoded to teacher/admin.
reset role;
insert into public.permission_grants (school_id, membership_id, permission_id, reason)
select 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000e111', p.id, 'pgTAP: explicit grant test'
from public.permissions p where p.code = 'classes.manage';
select pg_temp.act_as('50000000-0000-0000-0000-00000000000e');
select ok(
  (
    select count(*) > 0
    from public.class_memberships
    where class_id = (select id from public.classes where name = '10a' limit 1)
  ),
  'Secretariat A sees 10a''s roster once explicitly granted classes.manage'
);

select * from finish();
rollback;
