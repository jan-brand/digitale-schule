import { supabase } from "@/lib/supabase";
import { CampusError } from "@/lib/errors";

export interface SignInParams {
  schoolSlug: string;
  username: string;
  password: string;
}

interface AuthLoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string };
}

// Calls the auth-login Edge Function (supabase/functions/auth-login),
// which resolves schoolSlug+username to the real Supabase Auth identity
// server-side and lets GoTrue do the actual password check — see that
// function's own comments and doc/SECURITY_AUTH.md. On success, hydrates
// the shared supabase-js client with the returned session so every
// subsequent `supabase.from(...)` call carries the right JWT for RLS.
export async function signInWithUsername({ schoolSlug, username, password }: SignInParams): Promise<void> {
  const { data, error } = await supabase.functions.invoke<AuthLoginResponse | { error: string }>("auth-login", {
    body: { schoolSlug, username, password },
  });

  if (error || !data || "error" in data) {
    // Deliberately generic — mirrors the Edge Function's own refusal to
    // distinguish "wrong password" from "unknown school/username"
    // (doc/SECURITY_AUTH.md: no enumeration).
    throw new CampusError("unauthorized", "Anmeldung fehlgeschlagen. Bitte Angaben prüfen.");
  }

  const { error: setSessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (setSessionError) {
    throw new CampusError("unknown_error", "Sitzung konnte nicht gestartet werden.");
  }
}

// scope: "local" clears the device's session immediately without
// waiting on a server round-trip. The default "global" scope instead
// requires the server call to succeed (or fail with 404/401/403)
// before it clears anything locally — any other failure (network
// blip, backend downtime) leaves the user stuck signed in with the
// Abmelden button appearing to do nothing.
export async function signOut(): Promise<void> {
  await supabase.auth.signOut({ scope: "local" });
}
