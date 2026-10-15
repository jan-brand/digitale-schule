import { View } from "react-native";
import { Text } from "./Text";
import { useTheme } from "@/providers/ThemeProvider";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const TONE_COLORS: Record<BadgeTone, string> = {
  neutral: "#6B7280",
  success: "#15803D",
  warning: "#B45309",
  danger: "#D92D20",
};

// "Badge (nur echte Statussemantik)" — doc/UI_UX_SPECIFICATION.md §8.
// Never color-only (§9): the label text itself always carries the
// meaning, color is a reinforcement, not the only signal.
export function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  const { theme } = useTheme();
  const color = TONE_COLORS[tone];
  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: theme.radius.card,
        borderWidth: 1,
        borderColor: color,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
      }}
    >
      <Text variant="caption" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
