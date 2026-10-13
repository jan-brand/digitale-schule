import { Screen } from "@/components/ui/Screen";
import { StubNotice } from "@/components/ui/StubNotice";
import { Text } from "@/components/ui/Text";

// Real Supabase sign-in form is wired up in Phase F2 (doc/ARCHITECTURE.md:
// auth.signIn / AuthProvider).
export default function LoginScreen() {
  return (
    <Screen>
      <Text variant="title">Anmelden</Text>
      <StubNotice screen="Login" />
    </Screen>
  );
}
