-- Campus Foundation v0.1 — M13: fix a real, previously undetected bug.
--
-- public.profiles.id and public.school_memberships.user_id both
-- reference auth.users.id, but there is no FK directly between
-- school_memberships and profiles. PostgREST's embedding syntax
-- (`.select("...,profiles(...)")` from supabase-js) requires an actual
-- FK to resolve the relationship — it cannot infer one through a
-- shared grandparent. Every admin/dashboard query built since M4 that
-- embeds profiles through school_memberships (directly, or through
-- class_staff_assignments/class_memberships/course_memberships/
-- permission_grants) has therefore always failed with PGRST200 at the
-- real PostgREST layer ("Could not find a relationship between
-- 'school_memberships' and 'profiles'") — invisible until now because
-- every verification this project did before M13 went through either
-- raw SQL (throwaway Postgres pgTAP-style checks) or direct psql
-- queries, never through the actual REST API a browser uses.
--
-- Fix: add the missing FK directly. profiles rows always exist for
-- every school_memberships.user_id by the time a membership is
-- created (fn_handle_new_user's trigger creates the profiles row at
-- auth.users INSERT time, strictly before any membership can
-- reference that user), confirmed with zero orphaned rows on both the
-- local throwaway instance and the real server before applying this.
-- This FK is additional to (not a replacement for)
-- school_memberships_user_id_fkey — the two target different tables
-- (auth.users vs. profiles), so there is no new embedding ambiguity:
-- PostgREST only had zero resolvable paths to `profiles` before, now
-- exactly one.

alter table public.school_memberships
  add constraint school_memberships_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
