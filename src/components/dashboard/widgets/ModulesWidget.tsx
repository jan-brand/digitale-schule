import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { DashboardWidget, WidgetSize } from "@/components/ui/DashboardWidget";
import { useTheme } from "@/providers/ThemeProvider";

interface ModulesWidgetProps {
  hasAdminAccess: boolean;
  size: WidgetSize;
  controls?: React.ReactNode;
}

// W-05 "Module" (doc/UI_UX_SPECIFICATION.md §6.2/§6.7): only routes that
// actually exist and actually work in Foundation v0.1 — no disabled
// "coming soon" entries for timetable/grades/messenger etc., since §6.7
// explicitly forbids a non-functional preview appearing as an active
// feature.
export function ModulesWidget({ hasAdminAccess, size, controls }: ModulesWidgetProps) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <DashboardWidget title="Module" size={size} controls={controls}>
      <View style={{ gap: theme.spacing.sm }}>
        <Button label="Schule" variant="secondary" onPress={() => router.push("/(app)/school" as never)} />
        {hasAdminAccess ? (
          <Button
            label="Benutzerverwaltung"
            variant="secondary"
            onPress={() => router.push("/(app)/admin/users" as never)}
          />
        ) : null}
      </View>
    </DashboardWidget>
  );
}
