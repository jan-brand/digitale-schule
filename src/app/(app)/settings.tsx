import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { StubNotice } from "@/components/ui/StubNotice";
import { Text } from "@/components/ui/Text";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { ThemeMode } from "@/theme";

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "system", label: "System" },
  { mode: "light", label: "Hell" },
  { mode: "dark", label: "Dunkel" },
];

// Persists on-device only for now (AsyncStorage via ThemeProvider). M3
// syncs this through user_preferences once the schema is rebuilt
// post-PoC. Profile fields (first/last name, username) are stubbed until
// AuthProvider/profiles exist for real.
export default function SettingsScreen() {
  const { mode, setMode, theme } = useTheme();
  const { signOut } = useAuth();

  return (
    <Screen>
      <Text variant="title">Einstellungen</Text>

      <Text variant="body" style={{ marginTop: theme.spacing.lg }}>
        Profil
      </Text>
      <StubNotice screen="Profil" />

      <Text variant="body" style={{ marginTop: theme.spacing.lg }}>
        Darstellung
      </Text>
      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        {OPTIONS.map((option) => (
          <Button
            key={option.mode}
            label={option.label}
            variant={mode === option.mode ? "primary" : "secondary"}
            onPress={() => setMode(option.mode)}
          />
        ))}
      </View>

      <View style={{ marginTop: theme.spacing.xl }}>
        <Button label="Abmelden" variant="secondary" onPress={() => signOut()} />
      </View>
    </Screen>
  );
}
