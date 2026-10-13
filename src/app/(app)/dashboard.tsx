import { Screen } from "@/components/ui/Screen";
import { StubNotice } from "@/components/ui/StubNotice";
import { Text } from "@/components/ui/Text";

// One dashboard for every role (F13): shows name, school, role(s), enabled
// modules, and navigation to what actually exists — not a separate screen
// per role. Real data wiring depends on AuthProvider (M2) and the schema
// rebuild (M3, after the Auth PoC fixes profiles'/login_identifiers' shape).
export default function Dashboard() {
  return (
    <Screen>
      <Text variant="title">Dashboard</Text>
      <StubNotice screen="Dashboard" />
    </Screen>
  );
}
