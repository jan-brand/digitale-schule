import { View } from "react-native";
import { Button } from "./Button";
import { Text } from "./Text";
import { useTheme } from "@/providers/ThemeProvider";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

// doc/UI_UX_SPECIFICATION.md §6.6: distinguishable from EmptyState, no
// false success, retry only offered when the caller actually has
// something sensible to retry.
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{ alignItems: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.lg }}
    >
      <Text style={{ color: "#D92D20" }}>{message}</Text>
      {onRetry ? <Button label="Erneut versuchen" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}
