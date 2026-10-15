// POST { schoolSlug, username, firstName, lastName, password }
// -> { profileId } | 4xx { error }
//
// Creates a new Campus account: a real auth.users row with a synthetic
// "technical" email (never shown to anyone, never a real deliverable
// address), an active school_memberships row, and the
// internal.login_identifiers mapping used by auth-login to resolve
// (schoolSlug, username) -> that technical email.
//
// CLI-only for now (Phase M2/M6): must be called with the service-role
// key directly, never exposed to regular authenticated users or to the
// Expo client bundle. The full self-service invite/accept flow (D-008 —
// no open self-registration, admin/secretariat-driven invites) is M4
// work and will call a stricter version of this with its own
// authorization checks instead of a bare service-role gate.
import { sql } from "../_shared/db.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const EXPECTED_SERVICE_KEY = SERVICE_ROLE_KEY; // see authorization check below

interface ProvisionRequest {
  schoolSlug?: unknown;
  username?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  password?: unknown;
}

function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), { status: 500 });
  }

  // CLI-only gate: the caller must present the service-role key itself as
  // the bearer token. A regular user's JWT (even an admin's) is rejected —
  // this function is not reachable from the Expo client at all until M4
  // replaces this check with real per-caller authorization.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader !== `Bearer ${EXPECTED_SERVICE_KEY}`) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }

  let body: ProvisionRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_body" }), { status: 400 });
  }

  const schoolSlug = typeof body.schoolSlug === "string" ? body.schoolSlug.trim() : "";
  const usernameRaw = typeof body.username === "string" ? body.username : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!schoolSlug || !usernameRaw || !firstName || !lastName || !password) {
    return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400 });
  }
  const username = normalizeUsername(usernameRaw);

  const schoolRows = await sql<{ id: string }[]>`
    select id from public.schools where slug = ${schoolSlug} and status = 'active' limit 1
  `;
  if (schoolRows.length === 0) {
    return new Response(JSON.stringify({ error: "school_not_found" }), { status: 404 });
  }
  const schoolId = schoolRows[0].id;

  const existing = await sql<{ profile_id: string }[]>`
    select profile_id from internal.login_identifiers
    where school_id = ${schoolId} and username_normalized = ${username}
    limit 1
  `;
  if (existing.length > 0) {
    return new Response(JSON.stringify({ error: "username_taken" }), { status: 409 });
  }

  const technicalEmail = `u-${crypto.randomUUID()}@accounts.campus.internal`;

  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email: technicalEmail,
      password,
      email_confirm: true,
      // fn_handle_new_user (supabase/migrations/20261014180001_final_data_model.sql)
      // reads these three fields to populate profiles.{school_id,first_name,last_name}
      // at insert time — profiles.school_id is NOT NULL, so this must be present.
      user_metadata: { school_id: schoolId, first_name: firstName, last_name: lastName },
    }),
  });

  if (createRes.status !== 200 && createRes.status !== 201) {
    const detail = await createRes.json().catch(() => ({}));
    return new Response(JSON.stringify({ error: "auth_user_create_failed", detail }), { status: 502 });
  }
  const created = await createRes.json();
  const profileId = created.id as string;

  try {
    await sql`
      insert into public.school_memberships (school_id, user_id, status, joined_at)
      values (${schoolId}, ${profileId}, 'active', now())
    `;
    await sql`
      insert into internal.login_identifiers (profile_id, school_id, username_normalized, technical_email)
      values (${profileId}, ${schoolId}, ${username}, ${technicalEmail})
    `;
  } catch (err) {
    // Best-effort cleanup: don't leave an orphaned auth.users row with no
    // membership/login_identifiers if the second half fails (e.g. a race
    // on the username uniqueness check above).
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${profileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
    }).catch(() => {});
    return new Response(JSON.stringify({ error: "provisioning_failed", detail: String(err) }), { status: 500 });
  }

  return new Response(JSON.stringify({ profileId }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
});
