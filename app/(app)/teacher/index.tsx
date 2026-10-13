import { Screen } from "@/components/ui/Screen";
import { StubNotice } from "@/components/ui/StubNotice";
import { Text } from "@/components/ui/Text";

export default function TeacherDashboard() {
  return (
    <Screen>
      <Text variant="title">Dashboard – Lehrkraft</Text>
      <StubNotice screen="Lehrkräfte-Dashboard" />
    </Screen>
  );
}
