// POST { schoolSlug, username } -> always 200 {} (Verfahren A, D-012)
//
// Public, pre-auth entry point for self-service recovery via a verified
// contact email. Deliberately returns the exact same generic response
// whether or not the account exists, belongs to that school, or has a
// verified contact email — doc/SECURITY_AUTH.md: no account-existence
// disclosure. Only when every check actually passes does it generate a
// token, store its hash, and send the email (via the EmailSender
// abstraction — logged in dev, see supabase/functions/_shared/email.ts).
import { sql } from "../_shared/db.ts";
import { getEmailSender } from "../_shared/email.ts";

interface RequestBody {
  schoolSlug?: unknown;
  username?: unknown;
}

const GENERIC_OK = new Response(JSON.stringify({}), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});

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

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return GENERIC_OK;
  }

  const schoolSlug = typeof body.schoolSlug === "string" ? body.schoolSlug.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim() : "";
  if (!schoolSlug || !username) {
    return GENERIC_OK;
  }

  const rows = await sql<
    { profile_id: string; school_id: string; contact_email: string; first_name: string }[]
  >`
    select p.id as profile_id, s.id as school_id, p.contact_email, p.first_name
    from public.schools s
    join internal.login_identifiers li on li.school_id = s.id
    join public.profiles p on p.id = li.profile_id
    join public.school_memberships m on m.user_id = p.id and m.school_id = s.id
    where s.slug = ${schoolSlug}
      and li.username_normalized = ${username}
      and m.status = 'active'
      and p.contact_email is not null
      and p.contact_email_verified_at is not null
    limit 1
  `;

  if (rows.length === 0) {
    return GENERIC_OK;
  }
  const { profile_id: profileId, school_id: schoolId, contact_email: contactEmail, first_name: firstName } =
    rows[0];

  const token = randomToken();
  const tokenHash = await sha256Hex(token);

  await sql`
    insert into public.password_reset_requests (school_id, user_id, method, token_hash, expires_at)
    values (${schoolId}, ${profileId}, 'verified_email', ${tokenHash}, now() + interval '1 hour')
  `;

  // Real routing (wildcard subdomain + deep link) is GATE-HOST, not yet
  // decided (doc/DECISIONS.md) — this placeholder path documents the
  // intended shape without claiming a resolved hosting decision.
  const resetLink = `https://${schoolSlug}.campus.example/recover/confirm?token=${token}`;

  await getEmailSender().send({
    to: contactEmail,
    templateId: "password_reset",
    data: { firstName, resetLink, token },
  });

  return GENERIC_OK;
});
