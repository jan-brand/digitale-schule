import { Screen } from "@/components/ui/Screen";
import { StubNotice } from "@/components/ui/StubNotice";
import { Text } from "@/components/ui/Text";

// Per doc/ARCHITECTURE.md: parent view has no access to child data until
// custody/information-rights are modeled — out of scope for v0.1.
export default function ParentDashboard() {
  return (
    <Screen>
      <Text variant="title">Dashboard – Eltern</Text>
      <StubNotice screen="Eltern-Dashboard" />
    </Screen>
  );
}
