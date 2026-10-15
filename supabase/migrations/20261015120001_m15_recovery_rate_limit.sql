-- Campus Foundation v0.1 — M15: rate-limiting for the password-recovery
-- redeem endpoint (doc/ACCEPTANCE.md Gate 3: "Lehrkraft-Reset für
-- Schüler derselben Schule ...; Rate-Limit/Audit" — audit already
-- existed since M5, rate-limit did not).
--
-- Why this matters specifically for teacher_code: that path uses an
-- 8-digit numeric code (fn_issue_teacher_reset_code,
-- 20261014230001_m5_password_reset.sql) — 10^8 possibilities, valid for
-- 30 minutes, and password-recovery-redeem had no attempt throttling at
-- all. An unauthenticated script could brute-force a live code within
-- its validity window. The verified_email path's token is a random
-- 32-byte hex string (practically unguessable), so it does not need
-- this, but both paths share the same redeem endpoint, so both get
-- covered by the same limit.
--
-- Table only — the actual counting/blocking happens in
-- password-recovery-redeem (Edge Function, has request-level access to
-- the caller's IP via the Apache-forwarded X-Forwarded-For header; a
-- Postgres function reached through PostgREST does not have an
-- equivalent without extra plumbing). No RLS grants to anon/
-- authenticated, same posture as password_reset_requests — only the
-- Edge Function's privileged _shared/db.ts connection touches this.
create table public.recovery_redeem_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  attempted_at timestamptz not null default now()
);
create index recovery_redeem_attempts_ip_time_idx on public.recovery_redeem_attempts (ip_address, attempted_at);

alter table public.recovery_redeem_attempts enable row level security;
alter table public.recovery_redeem_attempts force row level security;
