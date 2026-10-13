import { Screen } from "@/components/ui/Screen";
import { StubNotice } from "@/components/ui/StubNotice";
import { Text } from "@/components/ui/Text";

// Real login (schoolSlug + username + password via auth.signIn, per
// doc/DATA_MODEL.md's API contract) is blocked on the Auth PoC (Gate 1 /
// GATE-AUTH in doc/DECISIONS.md) — username-only login without Supabase's
// native email/phone requirement isn't proven feasible yet.
export default function LoginScreen() {
  return (
    <Screen>
      <Text variant="title">Anmelden</Text>
      <StubNotice screen="Login (wartet auf Auth-PoC)" />
    </Screen>
  );
}
