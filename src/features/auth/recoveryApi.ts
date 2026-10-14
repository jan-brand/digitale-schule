import { supabase } from "@/lib/supabase";
import { CampusError } from "@/lib/errors";

// Both calls hit public, pre-auth Edge Functions (no session needed —
// the whole point of recovery is that the user can't log in yet). See
// supabase/functions/password-recovery-{request,redeem} and
// doc/SECURITY_AUTH.md "Recovery" / D-012.

export async function requestEmailRecovery(schoolSlug: string, username: string): Promise<void> {
  // Always resolves without throwing — the Edge Function itself never
  // reveals whether the account/email exists (no enumeration).
  await supabase.functions.invoke("password-recovery-request", {
    body: { schoolSlug, username },
  });
}

export async function redeemRecoveryCode(token: string, newPassword: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ error?: string }>(
    "password-recovery-redeem",
    { body: { token, newPassword } },
  );
  if (error || data?.error) {
    throw new CampusError("validation_failed", "Code ungültig, abgelaufen oder bereits verwendet.");
  }
}
