import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { ThemeMode } from "@/theme";

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "system", label: "System" },
  { mode: "light", label: "Hell" },
  { mode: "dark", label: "Dunkel" },
];

// Persists on-device only for now (AsyncStorage via ThemeProvider). Phase F3
// syncs this through user_preferences so it follows the user across devices
// (doc/ACCEPTANCE.md AC-09).
export default function AppearanceScreen() {
  const { mode, setMode, theme } = useTheme();

  return (
    <Screen>
      <Text variant="title">Darstellung</Text>
      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        {OPTIONS.map((option) => (
          <Button
            key={option.mode}
            label={option.label}
            variant={mode === option.mode ? "primary" : "secondary"}
            onPress={() => setMode(option.mode)}
          />
        ))}
      </View>
    </Screen>
  );
}
