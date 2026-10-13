import { Screen } from "@/components/ui/Screen";
import { StubNotice } from "@/components/ui/StubNotice";
import { Text } from "@/components/ui/Text";

export default function AdminDashboard() {
  return (
    <Screen>
      <Text variant="title">Dashboard – Administration</Text>
      <StubNotice screen="Admin-Dashboard" />
    </Screen>
  );
}
