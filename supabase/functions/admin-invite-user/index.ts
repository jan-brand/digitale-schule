// POST { firstName, lastName, roleCode, password? } -> { profileId,
// username, initialPassword } | 4xx { error }
// Authorization: Bearer <the calling admin's own access token>
//
// App-facing invite flow (D-008: schulinternes Einladungsverfahren, kein
// eigener Service-Role-Zugriff vom Client). Unlike
// supabase/functions/auth-provision-user (CLI-only, gated on the
// service-role key itself), this forwards the CALLER's own JWT to every
// RPC call so fn_finalize_invite/fn_assign_role run their real
// authorization checks (memberships.invite / school_admin / principal,
// self-escalation, principal-is-CLI-only) against the actual caller —
// the service-role key here is used ONLY for the Admin API call that
// creates the auth.users row (something no authenticated-role grant
// could ever do) and is never returned to the client.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { sql } from "../_shared/db.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface InviteRequest {
  firstName?: unknown;
  lastName?: unknown;
  roleCode?: unknown;
  password?: unknown;
  reason?: unknown;
}

function randomPassword(): string {
  // Shown exactly once in the response for the admin to relay
  // out-of-band (D-008/D-009) — never logged, never stored by us.
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "x");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 });
  }
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), { status: 500 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  let body: InviteRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_body" }), { status: 400 });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const roleCode = typeof body.roleCode === "string" ? body.roleCode : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const password = typeof body.password === "string" && body.password.length > 0 ? body.password : randomPassword();

  if (!firstName || !lastName || !roleCode || !reason) {
    return new Response(JSON.stringify({ error: "missing_fields" }), { status: 400 });
  }

  // Runs every RPC call AS the caller (forwarded JWT) so RLS and every
  // fn_*'s own auth.uid()-based authorization applies for real.
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: callerUser, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !callerUser?.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const callerSchoolRows = await sql<{ school_id: string }[]>`
    select school_id from public.school_memberships where user_id = ${callerUser.user.id} and status = 'active' limit 1
  `;
  if (callerSchoolRows.length === 0) {
    return new Response(JSON.stringify({ error: "caller_not_an_active_member" }), { status: 403 });
  }
  const schoolId = callerSchoolRows[0].school_id;

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
      user_metadata: { school_id: schoolId, first_name: firstName, last_name: lastName },
    }),
  });

  if (createRes.status !== 200 && createRes.status !== 201) {
    const detail = await createRes.json().catch(() => ({}));
    return new Response(JSON.stringify({ error: "auth_user_create_failed", detail }), { status: 502 });
  }
  const created = await createRes.json();
  const newUserId = created.id as string;

  async function cleanup() {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${newUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
    }).catch(() => {});
  }

  // fn_finalize_invite re-checks the caller's standing itself
  // (memberships.invite / school_admin / principal) — this is not a
  // rubber stamp, it's the actual authorization boundary.
  const { data: finalizeData, error: finalizeError } = await callerClient.rpc("fn_finalize_invite", {
    p_new_user_id: newUserId,
    p_first_name: firstName,
    p_last_name: lastName,
    p_reason: reason,
  });

  if (finalizeError || !finalizeData || finalizeData.length === 0) {
    await cleanup();
    return new Response(JSON.stringify({ error: "invite_not_authorized" }), { status: 403 });
  }

  const { membership_id: membershipId, username } = finalizeData[0];

  // History row for the new admin/invitations.tsx screen (M19). Written
  // already 'accepted' — this flow creates the account synchronously,
  // there is no real pending/token-email step to record (see this
  // migration's own comment, 20261016000001_m19_invitation_lifecycle.sql,
  // for why the originally-specified async token flow was never built).
  // token_hash has no real secret behind it here, only a NOT NULL UNIQUE
  // column from that original design — a random per-row value satisfies
  // the constraint without implying a redeemable token exists.
  const callerMembershipRows = await sql<{ id: string }[]>`
    select id from public.school_memberships where user_id = ${callerUser.user.id} and school_id = ${schoolId}
  `;
  await sql`
    insert into public.invitations (
      school_id, invited_by_membership_id, invited_identity_hint, proposed_role_codes,
      delivery_method, token_hash, status, expires_at, accepted_by_user_id, accepted_at
    )
    values (
      ${schoolId}, ${callerMembershipRows[0]?.id ?? null}, ${`${firstName} ${lastName}`},
      array[${roleCode}]::public.role_code[],
      'direct_account_creation', ${crypto.randomUUID()}, 'accepted', now(), ${newUserId}, now()
    )
  `;

  // fn_assign_role runs its own, already-tested self-escalation /
  // principal-is-CLI-only / delegation checks for the chosen role.
  const { error: assignError } = await callerClient.rpc("fn_assign_role", {
    p_target_membership_id: membershipId,
    p_role_code: roleCode,
    p_reason: reason,
  });

  if (assignError) {
    // The membership now exists without a role — not ideal, but not a
    // security hole (no role = no access beyond the RLS self-read
    // policies), and retrying role assignment separately is a normal
    // admin action (fn_assign_role itself). We do not clean up the
    // auth.users row at this point: unlike the finalize step, this
    // failure is about the ROLE choice being rejected (e.g. "principal"),
    // not about the invite itself being unauthorized.
    return new Response(
      JSON.stringify({ error: "role_assignment_failed", profileId: newUserId, username }),
      { status: 207 },
    );
  }

  return new Response(
    JSON.stringify({ profileId: newUserId, username, initialPassword: password }),
    { status: 201, headers: { "Content-Type": "application/json" } },
  );
});
