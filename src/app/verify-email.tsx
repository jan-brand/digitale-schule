import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { confirmEmailVerification } from "@/features/identity/contactEmailApi";

// Public route (see src/app/_layout.tsx Guard: exempt from both
// login/dashboard redirects) — the email link may be opened on a
// different device/browser than the one that requested verification,
// so this must work without a session. The token alone is the proof
// (fn_confirm_contact_email_verification, migration 20261015000003).
export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [state, setState] = useState<"checking" | "success" | "failure" | "missing">(
    token ? "checking" : "missing",
  );

  useEffect(() => {
    if (!token) {
      setState("missing");
      return;
    }
    let cancelled = false;
    confirmEmailVerification(token).then((ok) => {
      if (!cancelled) setState(ok ? "success" : "failure");
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <Screen>
      <Text variant="title">E-Mail-Verifizierung</Text>
      {state === "checking" ? <Text variant="body">Wird geprüft…</Text> : null}
      {state === "missing" ? <Text variant="body">Kein Verifizierungs-Code übergeben.</Text> : null}
      {state === "success" ? (
        <Text variant="body">E-Mail-Adresse erfolgreich verifiziert. Sie können dieses Fenster schließen.</Text>
      ) : null}
      {state === "failure" ? (
        <Text variant="body">Link ungültig, abgelaufen oder bereits verwendet.</Text>
      ) : null}
    </Screen>
  );
}
