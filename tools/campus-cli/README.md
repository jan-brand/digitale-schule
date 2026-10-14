# Campus Operator CLI

A separate, operator-only tool — **not** part of the Expo app, never
bundled into the mobile/web client (D-024, doc/ARCHITECTURE.md). It
connects directly to Postgres with privileged credentials and, for
account creation, calls the Supabase Auth Admin API with the
service-role key. Neither of those secrets ever appears in `EXPO_PUBLIC_*`
or anywhere under `src/`.

## Setup

```bash
export CAMPUS_CLI_DB_URL="postgresql://<privileged-user>@<host>:<port>/postgres"
export CAMPUS_CLI_SUPABASE_URL="https://supabase.jan-brand.space"
export CAMPUS_CLI_SERVICE_ROLE_KEY="<service-role key>"
```

Never commit these. `CAMPUS_CLI_DB_URL` needs the same migration-level
access used to apply `supabase/migrations/*.sql`.

## Commands

```bash
npm run cli -- create-school --slug demo-c --name "Campus Schule C" --operator "<your name>"

npm run cli -- create-first-admin \
  --school-slug demo-c --first-name Max --last-name Mustermann --operator "<your name>"
# Prints the generated username + a one-time initial password — relay
# it out-of-band, then discard it; it is never stored or logged again.

npm run cli -- assign-principal \
  --school-slug demo-c --profile-id <uuid> --reason "..." --operator "<your name>"

npm run cli -- revoke-principal \
  --school-slug demo-c --profile-id <uuid> --reason "..." --operator "<your name>"
# Refuses if it would leave the school with zero active
# school_admin/principal — same invariant as fn_assert_active_admin_remains.

npm run cli -- emergency-restore-admin \
  --school-slug demo-c --profile-id <uuid> --reason "..." --operator "<your name>"
# Break-glass only: refuses to run if the school already has an active
# admin/principal. Reactivates the target membership and grants
# school_admin.

npm run cli -- school-status --school-slug demo-c
```

Every privileged command requires `--reason` (where applicable) and
`--operator`, and writes an `audit_events` row — but see the caveat
below before treating that as a full access-control system.

## What this deliberately does NOT solve (doc/DECISIONS.md OPEN-10)

> Betreiber-CLI: Provisionierung, Break-glass, Audit,
> Rotation/Verwahrung von Credentials und Vier-Augen-Kontrolle der
> Betreiberidentität — explicitly unresolved.

This CLI has no login, no operator-identity system, and no two-person
approval. `--operator` is a free-text string recorded for traceability,
not an authenticated identity. The actual authorization boundary right
now is **who holds `CAMPUS_CLI_DB_URL`/`CAMPUS_CLI_SERVICE_ROLE_KEY`** —
an operational control (how tightly those credentials are held and
rotated), not a software one. Building real operator authentication,
credential rotation, and four-eyes approval for break-glass actions
remains open work, not something this tool invents on its own.

## Verification performed

Every command was run directly (not just its underlying SQL) against a
throwaway local Postgres: `create-school` (including duplicate-slug
rejection), `assign-principal`/`revoke-principal` (including the
last-admin-remains refusal), `emergency-restore-admin` (both the
refusal-when-not-locked-out and the actual break-glass recovery path),
and `school-status`. `school-status` was additionally run read-only
against the real target instance. `create-first-admin`'s Admin-API call
was not exercised against the real instance in this session (creating a
real account is a mutation outside what was verified live here) — its
logic after that call is identical to the already-verified
`auth-provision-user`/`admin-invite-user` pattern.
