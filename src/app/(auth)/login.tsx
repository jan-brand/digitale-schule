import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { isValidLoginInput } from "@/features/auth/username";

// Calls auth-login (via AuthProvider.signIn), which resolves
// schoolSlug+username to the real Supabase Auth identity server-side —
// see doc/ARCHITECTURE.md "Auth-Grenze" and supabase/functions/auth-login.
// Errors are shown generically; the Edge Function itself never
// distinguishes "wrong school/username" from "wrong password"
// (doc/SECURITY_AUTH.md: no enumeration), so neither does this screen.
export default function LoginScreen() {
  const { signIn } = useAuth();
  const { theme } = useTheme();
  const [schoolSlug, setSchoolSlug] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = isValidLoginInput(schoolSlug, username, password) && !loading;

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn({ schoolSlug, username, password });
    } catch {
      setError("Anmeldung fehlgeschlagen. Bitte Schule, Benutzername und Passwort prüfen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Text variant="title">Anmelden</Text>
      <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
        <Input
          label="Schule"
          placeholder="z. B. demo-a"
          value={schoolSlug}
          onChangeText={setSchoolSlug}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Input
          label="Benutzername"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Input
          label="Passwort"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          errorMessage={error ?? undefined}
        />
        <Button label="Anmelden" onPress={handleSubmit} disabled={!canSubmit} loading={loading} />
      </View>
    </Screen>
  );
}
