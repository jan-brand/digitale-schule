import { View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { DashboardWidget, WidgetSize } from "@/components/ui/DashboardWidget";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { CurrentMember } from "@/features/identity/useCurrentMember";

// W-02 "Mein Konto" (doc/UI_UX_SPECIFICATION.md §6.2) — own profile and
// role/status, nothing about any other account.
export function MyAccountWidget({
  member,
  size,
  controls,
}: {
  member: CurrentMember;
  size: WidgetSize;
  controls?: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <DashboardWidget title="Mein Konto" size={size} controls={controls}>
      <Text>{`${member.firstName} ${member.lastName}`}</Text>
      <View style={{ flexDirection: "row", gap: theme.spacing.xs, flexWrap: "wrap", marginTop: theme.spacing.sm }}>
        {member.roles.length === 0 ? <Text variant="caption">Keine Rolle zugewiesen.</Text> : null}
        {member.roles.map((role) => (
          <Badge key={role} label={role} />
        ))}
      </View>
    </DashboardWidget>
  );
}
