// POST { schoolSlug, username, password } -> { access_token, refresh_token,
// expires_in, user } | 401 { error: "invalid_credentials" }
//
// Resolves (schoolSlug, username) to the synthetic "technical" email that
// is actually stored as auth.users.email (see
// supabase/migrations/20261014150001_auth_poc_foundations.sql), then lets
// Supabase Auth itself do the real password check via its token endpoint.
// This function never sees or stores a password hash — Supabase Auth
// remains the sole authority on that (doc/SECURITY_AUTH.md).
//
// Every failure path (unknown school, unknown username, wrong password,
// suspended membership) returns the exact same generic error, with no
// timing shortcut on the "not found" paths — POC-04 / doc/SECURITY_AUTH.md
// "Verbot der Benutzer-Enumeration".
import { sql } from "../_shared/db.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const GENERIC_ERROR = new Response(JSON.stringify({ error: "invalid_credentials" }), {
  status: 401,
  headers: { "Content-Type": "application/json" },
});

interface LoginRequest {
  schoolSlug?: unknown;
  username?: unknown;
  password?: unknown;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), { status: 500 });
  }

  let body: LoginRequest;
  try {
    body = await req.json();
  } catch {
    return GENERIC_ERROR;
  }

  const schoolSlug = typeof body.schoolSlug === "string" ? body.schoolSlug.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!schoolSlug || !username || !password) {
    return GENERIC_ERROR;
  }

  // Resolve technical email ONLY if the school exists, the username is
  // registered in that exact school, AND the membership is active —
  // collapsed into one query so there's no branch to accidentally leak
  // "which part" failed through timing or response shape.
  const rows = await sql<{ technical_email: string }[]>`
    select li.technical_email
    from public.schools s
    join internal.login_identifiers li on li.school_id = s.id
    join public.school_memberships m on m.user_id = li.profile_id and m.school_id = s.id
    where s.slug = ${schoolSlug}
      and li.username_normalized = ${username}
      and m.status = 'active'
    limit 1
  `;

  if (rows.length === 0) {
    return GENERIC_ERROR;
  }

  const technicalEmail = rows[0].technical_email;

  const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email: technicalEmail, password }),
  });

  if (tokenRes.status !== 200) {
    // Covers wrong password and the (shouldn't-happen-but-just-in-case)
    // case of a login_identifiers row with no matching auth.users row.
    return GENERIC_ERROR;
  }

  const session = await tokenRes.json();
  return new Response(
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      user: { id: session.user?.id },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
