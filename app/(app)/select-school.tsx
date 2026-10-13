import { Screen } from "@/components/ui/Screen";
import { StubNotice } from "@/components/ui/StubNotice";
import { Text } from "@/components/ui/Text";

// Real multi-membership picker is wired to schools.listMine in Phase F2
// (SchoolProvider, doc/ARCHITECTURE.md).
export default function SelectSchoolScreen() {
  return (
    <Screen>
      <Text variant="title">Schule auswählen</Text>
      <StubNotice screen="Schulauswahl" />
    </Screen>
  );
}
