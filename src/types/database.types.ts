// Generated Supabase database types placeholder.
//
// Run `npm run db:types` with SUPABASE_DB_URL pointing at a reachable
// Postgres instance running these migrations (supabase/migrations/) to
// generate the real `Database` type here.
//
// NOT regenerated yet on purpose: doc/DATA_MODEL.md's schema (profiles,
// school_memberships, login_identifiers) is explicitly not final until
// the Auth PoC (Gate 1) determines how username-login actually maps to
// auth.users — regenerating now would just be thrown away after the M3
// schema rebuild.

export type Database = Record<string, never>;
