// Direct Postgres connection for Edge Functions that need the `internal`
// schema (login_identifiers, and later password_reset_codes etc.) — that
// schema is deliberately NOT in Supabase's exposed db_schema list, so it
// is unreachable through supabase-js/PostgREST even with the service-role
// key. Edge Functions talk to it over a direct connection instead.
//
// SUPABASE_DB_URL is provided by the Supabase Edge Runtime itself; never
// hard-code a connection string here.
import postgres from "https://esm.sh/postgres@3.4.4";

const databaseUrl = Deno.env.get("SUPABASE_DB_URL");
if (!databaseUrl) {
  throw new Error("SUPABASE_DB_URL is not set in the Edge Function environment.");
}

export const sql = postgres(databaseUrl, {
  // Edge Functions are short-lived; keep the pool tiny.
  max: 3,
});
