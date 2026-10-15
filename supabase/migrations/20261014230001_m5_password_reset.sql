-- Campus Foundation v0.1 — M5 (part 1): password reset.
--
-- Two recovery paths (doc/SECURITY_AUTH.md "Recovery", D-012):
--   A) verified contact email — self-service, pre-auth.
--   B) teacher-issued one-time code — the teacher relays it to the
--      student directly (D-011), never emailed.
--
-- Neither path can set a new Supabase Auth password from plain SQL (only
-- the Admin API can, with the service-role key) — so the privileged part
-- of both flows lives in Edge Functions (password-recovery-request,
-- password-recovery-redeem), using their own direct Postgres connection
-- (supabase/functions/_shared/db.ts) the same way auth-login/
-- admin-invite-user already do for pre-auth/service-mediated logic.
-- The one piece that genuinely needs a SECURITY DEFINER function is
-- *issuing* a teacher code, because authorization depends on the
-- CALLER's own identity (auth.uid()) — that part is below.

-- ---------------------------------------------------------------------
-- profiles: a separate, explicitly-verified contact email (POC-05) —
-- never auth.users.email (the synthetic login identifier), so verifying
-- or changing it can never break username login.
-- ---------------------------------------------------------------------

alter table public.profiles
  add column contact_email citext,
  add column contact_email_verified_at timestamptz;

create unique index profiles_school_contact_email_key
  on public.profiles (school_id, contact_email)
  where contact_email is not null;

alter table public.password_reset_requests
  add constraint password_reset_requests_method_check
  check (method in ('teacher_code', 'verified_email'));

-- ---------------------------------------------------------------------
-- fn_issue_teacher_reset_code: the only way a 'teacher_code' row is
-- created. Caller must be an active teacher (or school_admin/principal —
-- not excluded by doc/SECURITY_AUTH.md, which only names teachers as the
-- minimum grant) in the SAME school as the target, and the target must
-- be a student — never an adult/privileged account (doc/SECURITY_AUTH.md:
-- "nie für erwachsene oder privilegierte Rollen"). Any previous
-- unconsumed teacher_code for that target is invalidated first, so only
-- one code can ever be active at a time. Returns the plaintext code —
-- shown exactly once to the caller, who relays it to the student
-- out-of-band; only its hash is ever stored.
-- ---------------------------------------------------------------------

create function public.fn_issue_teacher_reset_code(p_target_profile_id uuid, p_reason text)
returns text
language plpgsql
security definer
-- `extensions` (not just `public`) is required here: on the real
-- instance pgcrypto's digest() lives in `extensions`, not `public` (the
-- session default search_path is "$user", public, extensions for
-- exactly this reason — but a SECURITY DEFINER function's explicit
-- `set search_path` overrides that default entirely, so it must be
-- listed here too). Found by actually running this against the real
-- server, not the throwaway test instance, where pgcrypto happened to
-- install into `public` by default.
set search_path = public, extensions, pg_temp
as $$
declare
  v_school_id uuid;
  v_caller public.school_memberships;
  v_code text;
  v_hash text;
begin
  select school_id into v_school_id from public.profiles where id = p_target_profile_id;
  if v_school_id is null then
    raise exception 'profile_not_found';
  end if;

  v_caller := public.fn_caller_membership(v_school_id);
  if v_caller.id is null then
    raise exception 'caller_not_an_active_member';
  end if;

  if not (
    public.fn_has_role(v_school_id, 'teacher')
    or public.fn_is_school_admin(v_school_id)
  ) then
    raise exception 'not_authorized_to_issue_reset_code';
  end if;

  if not exists (
    select 1
    from public.role_assignments ra
    join public.roles r on r.id = ra.role_id
    join public.school_memberships m on m.id = ra.membership_id
    where m.user_id = p_target_profile_id
      and r.code = 'student'
      and ra.revoked_at is null
      and m.status = 'active'
  ) then
    raise exception 'reset_forbidden_for_role';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required';
  end if;

  -- One active code at a time per target.
  update public.password_reset_requests
  set consumed_at = now()
  where user_id = p_target_profile_id and method = 'teacher_code' and consumed_at is null;

  v_code := lpad(floor(random() * 100000000)::text, 8, '0');
  v_hash := encode(digest(v_code, 'sha256'), 'hex');

  insert into public.password_reset_requests (school_id, user_id, initiator_id, method, token_hash, expires_at)
  values (v_school_id, p_target_profile_id, v_caller.id, 'teacher_code', v_hash, now() + interval '30 minutes');

  perform public.fn_write_audit_event(
    v_school_id, 'password_reset.issue', 'profile', p_target_profile_id, p_reason, 'success', v_caller.id
  );

  return v_code;
end;
$$;

revoke all on function public.fn_issue_teacher_reset_code(uuid, text) from public;
grant execute on function public.fn_issue_teacher_reset_code(uuid, text) to authenticated;
