import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { DashboardWidget, WidgetSize } from "@/components/ui/DashboardWidget";
import { useTheme } from "@/providers/ThemeProvider";

interface SecurityWidgetProps {
  onSignOut: () => void;
  size: WidgetSize;
}

// S-02 "Sicherheit" (doc/SETTINGS_WIDGETS_PLAN.md §3) — fest, nicht
// ausblendbar: Abmelden muss aus den Einstellungen immer erreichbar
// bleiben, unabhängig von Personalisierung.
export function SecurityWidget({ onSignOut, size }: SecurityWidgetProps) {
  const { theme } = useTheme();
  return (
    <DashboardWidget title="Sicherheit" size={size}>
      <View style={{ gap: theme.spacing.sm }}>
        <Button label="Abmelden" variant="secondary" onPress={onSignOut} />
      </View>
    </DashboardWidget>
  );
}
