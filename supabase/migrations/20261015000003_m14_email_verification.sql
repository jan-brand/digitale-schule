-- Campus Foundation v0.1 — M14: real contact-email verification (closes
-- POC-05, the one Gate-1 item left as "architecturally resolved, not
-- built" since M2 — see doc/ACCEPTANCE.md).
--
-- Found while building this: public.profiles had `grant select, update
-- on public.profiles to authenticated` (table-wide, M3) plus
-- `profiles_update_own` restricting WHICH ROW (id = auth.uid()) but not
-- WHICH COLUMNS. That meant any authenticated user could already set
-- their own profiles.contact_email_verified_at directly via a plain
-- PostgREST PATCH — completely bypassing any verification flow before
-- one even existed. Not currently exploitable for anything (nothing
-- reads profiles.status for authorization either — confirmed by
-- grepping the whole codebase, only school_memberships.status gates
-- anything), but contact_email_verified_at becoming meaningful as of
-- this migration makes it worth tightening now rather than after.

-- 1) Tighten profiles UPDATE to column-level grants: only the columns a
-- user should ever touch on their own profile. status/school_id/
-- contact_email_verified_at are never client-settable from here on.
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, contact_email) on public.profiles to authenticated;

-- 2) Changing contact_email must invalidate any prior verification —
-- enforced at the table level (not just in application code) so it
-- holds regardless of which path writes the column.
create function public.fn_reset_contact_email_verification()
returns trigger
language plpgsql
as $$
begin
  if new.contact_email is distinct from old.contact_email then
    new.contact_email_verified_at := null;
  end if;
  return new;
end;
$$;

create trigger trg_reset_contact_email_verification
  before update on public.profiles
  for each row
  execute function public.fn_reset_contact_email_verification();

-- 3) Verification tokens — same shape and security posture as
-- password_reset_requests (hashed token, not plaintext; expiry;
-- single-use via consumed_at). No RLS grant to authenticated/anon at
-- all: only reachable via the email-verification-request Edge Function
-- (using the privileged _shared/db.ts connection, like
-- password-recovery-request already does) and the
-- fn_confirm_contact_email_verification SECURITY DEFINER function
-- below.
create table public.email_verification_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  contact_email citext not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index email_verification_requests_school_id_idx on public.email_verification_requests (school_id);
create index email_verification_requests_profile_id_idx on public.email_verification_requests (profile_id);

alter table public.email_verification_requests enable row level security;
alter table public.email_verification_requests force row level security;
-- Deliberately no grants to anon/authenticated: no policy needed when
-- nothing is granted — PostgREST can't reach this table at all.

-- 4) fn_confirm_contact_email_verification: the only path that can set
-- contact_email_verified_at. Callable without a session (the user may
-- click the email link on a different device/browser than the one they
-- requested verification from) — the token itself is the proof, same
-- trust model as password-recovery-redeem. Atomic claim via
-- UPDATE...RETURNING prevents double-consumption. The contact_email
-- equality check guards against a stale token resurrecting
-- verification for an email the user has since changed away from (the
-- trigger above already nulls verified_at on change, but a token
-- issued for the old email must not re-verify a newer one either).
create function public.fn_confirm_contact_email_verification(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_token_hash text;
  v_request public.email_verification_requests;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return false;
  end if;

  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');

  update public.email_verification_requests
  set consumed_at = now()
  where token_hash = v_token_hash
    and consumed_at is null
    and expires_at > now()
  returning * into v_request;

  if v_request.id is null then
    return false;
  end if;

  update public.profiles
  set contact_email_verified_at = now()
  where id = v_request.profile_id
    and contact_email = v_request.contact_email;

  return found;
end;
$$;

revoke all on function public.fn_confirm_contact_email_verification(text) from public;
grant execute on function public.fn_confirm_contact_email_verification(text) to anon, authenticated;
