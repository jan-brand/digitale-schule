import { Screen } from "@/components/ui/Screen";
import { StubNotice } from "@/components/ui/StubNotice";
import { Text } from "@/components/ui/Text";

export default function ResetPasswordScreen() {
  return (
    <Screen>
      <Text variant="title">Passwort zurücksetzen</Text>
      <StubNotice screen="Passwort zurücksetzen" />
    </Screen>
  );
}
