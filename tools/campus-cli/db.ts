// Direct, privileged Postgres connection for the operator CLI — this is
// NOT the app's supabase-js client (src/lib/supabase.ts), and this
// module is never imported from src/app, so it can never end up in the
// Expo bundle (D-024, doc/ARCHITECTURE.md: "Technische Betreiber-CLI...
// nicht in Expo").
//
// Required environment variables (never EXPO_PUBLIC_*, never committed):
//   CAMPUS_CLI_DB_URL            postgres://... with migration-level
//                                privileges (same connection class used
//                                to apply migrations in this project).
//   CAMPUS_CLI_SUPABASE_URL      e.g. https://supabase.jan-brand.space
//   CAMPUS_CLI_SERVICE_ROLE_KEY  service-role key, for the Admin API
//                                calls that create auth.users rows.
//
// doc/DECISIONS.md OPEN-10 (Betreiber-CLI: Provisionierung, Break-glass,
// Rotation/Verwahrung von Credentials, Vier-Augen-Kontrolle der
// Betreiberidentität) is explicitly NOT resolved — this CLI does not
// invent an operator-authentication system. Holding these credentials
// at all IS the authorization boundary for now; every command still
// requires --operator and --reason, recorded in the audit trail, so
// at least WHO ran WHAT is traceable even though WHO is allowed to hold
// the credentials remains an operational, not a software, control.
import { randomBytes } from "node:crypto";
import { Client } from "pg";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: requireEnv("CAMPUS_CLI_DB_URL") });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function adminCreateAuthUser(params: {
  email: string;
  password: string;
  schoolId: string;
  firstName: string;
  lastName: string;
}): Promise<string> {
  const supabaseUrl = requireEnv("CAMPUS_CLI_SUPABASE_URL");
  const serviceRoleKey = requireEnv("CAMPUS_CLI_SERVICE_ROLE_KEY");

  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        school_id: params.schoolId,
        first_name: params.firstName,
        last_name: params.lastName,
      },
    }),
  });

  if (res.status !== 200 && res.status !== 201) {
    const detail = await res.text();
    throw new Error(`Admin API user creation failed (${res.status}): ${detail}`);
  }
  const created = (await res.json()) as { id: string };
  return created.id;
}

export function randomPassword(): string {
  return randomBytes(18).toString("base64").replace(/[+/=]/g, "x");
}
