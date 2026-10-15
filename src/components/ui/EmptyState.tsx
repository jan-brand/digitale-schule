import { View } from "react-native";
import { Button } from "./Button";
import { Text } from "./Text";
import { useTheme } from "@/providers/ThemeProvider";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

// doc/UI_UX_SPECIFICATION.md §6.6/§17 (UX-DEC-26): compact, honest —
// never invented data, and an action only when one genuinely exists and
// is authorized (callers decide that; this component just renders what
// it's given).
export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: theme.spacing.sm, paddingVertical: theme.spacing.lg }}>
      <Text variant="caption">{message}</Text>
      {actionLabel && onAction ? <Button label={actionLabel} variant="secondary" onPress={onAction} /> : null}
    </View>
  );
}
