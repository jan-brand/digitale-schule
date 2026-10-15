// POST (authenticated, own session) -> 200 { ok: true } | 400/401/500
//
// Closes POC-05: a real email-verification flow for public.profiles.
// contact_email, instead of just the columns that existed since M5.
// Unlike password-recovery-request (public, pre-auth, deliberately
// generic to avoid account enumeration), this is self-service and
// authenticated — the caller is verifying their own already-known
// email, so there's no enumeration concern in returning a specific
// outcome.
//
// Authorization: Bearer <the caller's own access token>, forwarded to
// Supabase Auth itself to resolve the real user id (not decoded
// client-side) — same pattern as admin-invite-user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { sql } from "../_shared/db.ts";
import { getEmailSender } from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 });
  }
  if (!SUPABASE_URL || !ANON_KEY) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), { status: 500 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const rows = await sql<
    { profile_id: string; school_id: string; contact_email: string; first_name: string; slug: string }[]
  >`
    select p.id as profile_id, p.school_id, p.contact_email, p.first_name, s.slug
    from public.profiles p
    join public.schools s on s.id = p.school_id
    where p.id = ${userData.user.id}
      and p.contact_email is not null
      and p.contact_email_verified_at is null
    limit 1
  `;

  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: "no_unverified_contact_email" }), { status: 400 });
  }
  const { profile_id: profileId, school_id: schoolId, contact_email: contactEmail, first_name: firstName, slug } =
    rows[0];

  const token = randomToken();
  const tokenHash = await sha256Hex(token);

  await sql`
    insert into public.email_verification_requests (school_id, profile_id, contact_email, token_hash, expires_at)
    values (${schoolId}, ${profileId}, ${contactEmail}, ${tokenHash}, now() + interval '24 hours')
  `;

  // Same GATE-HOST caveat as password-recovery-request: the real
  // wildcard-subdomain routing decision isn't made yet
  // (doc/DECISIONS.md), so this documents the intended link shape
  // without claiming a resolved hosting decision.
  const verifyLink = `https://${slug}.campus.example/verify-email?token=${token}`;

  await getEmailSender().send({
    to: contactEmail,
    templateId: "email_verification",
    data: { firstName, verifyLink, token },
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
