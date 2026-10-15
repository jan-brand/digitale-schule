import { ActivityIndicator, View } from "react-native";
import { Text } from "./Text";
import { useTheme } from "@/providers/ThemeProvider";

// doc/UI_UX_SPECIFICATION.md §8/§6.6: a distinguishable loading state,
// not just a spinner with no announcement for assistive technology.
export function LoadingState({ label = "Lädt…" }: { label?: string }) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={{ alignItems: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.lg }}
    >
      <ActivityIndicator color={theme.colors.action} />
      <Text variant="caption">{label}</Text>
    </View>
  );
}
