import { supabase } from "@/lib/supabase";
import { CampusError } from "@/lib/errors";

// POC-05: real contact-email verification. Setting the email is a plain
// PostgREST PATCH — allowed only for the caller's own row, and only for
// this specific column (migration 20261015000003 revoked the old
// table-wide UPDATE grant on public.profiles and replaced it with a
// column-level grant). The server-side trigger on that same migration
// nulls contact_email_verified_at whenever contact_email changes, so
// there is nothing for the client to reset itself.

export async function setOwnContactEmail(userId: string, contactEmail: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ contact_email: contactEmail }).eq("id", userId);
  if (error) {
    throw new CampusError("validation_failed", "E-Mail-Adresse konnte nicht gespeichert werden.");
  }
}

export async function requestOwnEmailVerification(): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ error?: string }>("email-verification-request", {
    body: {},
  });
  if (error || data?.error) {
    throw new CampusError("validation_failed", "Verifizierung konnte nicht angefragt werden.");
  }
}

export async function confirmEmailVerification(token: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("fn_confirm_contact_email_verification", { p_token: token });
  if (error) return false;
  return data === true;
}
