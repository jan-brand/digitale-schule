import { Screen } from "@/components/ui/Screen";
import { StubNotice } from "@/components/ui/StubNotice";
import { Text } from "@/components/ui/Text";

export default function ProfileScreen() {
  return (
    <Screen>
      <Text variant="title">Profil</Text>
      <StubNotice screen="Profil" />
    </Screen>
  );
}
