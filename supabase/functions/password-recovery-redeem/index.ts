// POST { token, newPassword } -> 200 {} | 400 { error: "invalid_or_expired_code" }
//
// Shared redemption for BOTH recovery paths (teacher_code and
// verified_email use the same table/hash scheme — see
// supabase/migrations/20261014230001_m5_password_reset.sql). Public,
// pre-auth: the token itself is the only credential. The UPDATE...
// RETURNING below claims the row atomically (consumed_at set in the same
// statement that checks it's still claimable), so two concurrent
// redemption attempts with the same token can't both succeed — "einmalig
// verwendbar" (doc/SECURITY_AUTH.md).
import { sql } from "../_shared/db.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const GENERIC_ERROR = new Response(JSON.stringify({ error: "invalid_or_expired_code" }), {
  status: 400,
  headers: { "Content-Type": "application/json" },
});

interface RedeemRequest {
  token?: unknown;
  newPassword?: unknown;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), { status: 500 });
  }

  let body: RedeemRequest;
  try {
    body = await req.json();
  } catch {
    return GENERIC_ERROR;
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  if (!token || newPassword.length < 8) {
    return GENERIC_ERROR;
  }

  const tokenHash = await sha256Hex(token);

  const claimed = await sql<{ id: string; school_id: string; user_id: string; method: string }[]>`
    update public.password_reset_requests
    set consumed_at = now()
    where token_hash = ${tokenHash} and consumed_at is null and expires_at > now()
    returning id, school_id, user_id, method
  `;

  if (claimed.length === 0) {
    return GENERIC_ERROR;
  }
  const { id: requestId, school_id: schoolId, user_id: userId, method } = claimed[0];

  const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ password: newPassword }),
  });

  if (updateRes.status !== 200) {
    // The code is already consumed at this point (atomic claim above) —
    // deliberate: see the module comment on why we don't try to "give
    // the code back" on a downstream failure.
    return new Response(JSON.stringify({ error: "password_update_failed" }), { status: 502 });
  }

  // Direct insert (this connection runs as a trusted service role, same
  // as every other Edge-Function-side write to tables with no
  // `authenticated` grant) — there is no authenticated actor to attribute
  // this to via fn_write_audit_event, so actor_user_id/actor_membership_id
  // stay null; the method and request id make it traceable.
  await sql`
    insert into public.audit_events (school_id, action, target_type, target_id, outcome, metadata)
    values (${schoolId}, 'password_reset.redeem', 'password_reset_request', ${requestId}, 'success', ${sql.json({ method })})
  `;

  return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
});
