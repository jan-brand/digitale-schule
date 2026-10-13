import { Screen } from "@/components/ui/Screen";
import { StubNotice } from "@/components/ui/StubNotice";
import { Text } from "@/components/ui/Text";

// Two recovery paths per doc/SECURITY_AUTH.md: verified-email reset link,
// or a teacher-issued one-time code for students without a verified email.
// Both depend on the Auth PoC's outcome (GATE-AUTH).
export default function RecoverScreen() {
  return (
    <Screen>
      <Text variant="title">Zugang wiederherstellen</Text>
      <StubNotice screen="Recovery (wartet auf Auth-PoC)" />
    </Screen>
  );
}
