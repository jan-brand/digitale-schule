import { View } from "react-native";
import { Button } from "./Button";
import { useTheme } from "@/providers/ThemeProvider";
import { ThemeMode } from "@/theme";

const OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "system", label: "System" },
  { mode: "light", label: "Hell" },
  { mode: "dark", label: "Dunkel" },
];

// Extracted from (app)/settings.tsx so it can be reused (e.g. in a
// future TopBar account menu) without duplicating the option list.
// Autosaves (UX-DEC-11: harmless preference) via ThemeProvider.
export function ThemeToggle() {
  const { mode, setMode, theme } = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {OPTIONS.map((option) => (
        <Button
          key={option.mode}
          label={option.label}
          variant={mode === option.mode ? "primary" : "secondary"}
          onPress={() => setMode(option.mode)}
        />
      ))}
    </View>
  );
}
