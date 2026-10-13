import { Screen } from "@/components/ui/Screen";
import { StubNotice } from "@/components/ui/StubNotice";
import { Text } from "@/components/ui/Text";

export default function StudentDashboard() {
  return (
    <Screen>
      <Text variant="title">Dashboard – Schüler</Text>
      <StubNotice screen="Schüler-Dashboard" />
    </Screen>
  );
}
