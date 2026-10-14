import { View } from "react-native";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";

// doc/UI_UX_SPECIFICATION.md §4 "Desktop": "Topbar: Campus-Name,
// Seitentitel, Theme-/Account-Menü; kein Schulwechsel." UX-DEC-07 wants
// a global search here too, but real cross-entity search (members/
// classes/subjects/courses, RLS-respecting) is its own feature, not
// part of "App Shell und Navigation" — per §16.1's own allowance, shown
// as a clearly-labeled disabled field rather than a fake/simulated
// result list.
export function TopBar({ title }: { title: string }) {
  const { theme } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.accent,
        backgroundColor: theme.colors.surface,
      }}
    >
      <Text variant="title">{title}</Text>
      <View style={{ width: 220 }}>
        <Input
          label="Suche (noch nicht verfügbar)"
          placeholder="Noch nicht verfügbar"
          editable={false}
          accessibilityHint="Die globale Suche ist in dieser Version noch nicht verfügbar."
        />
      </View>
    </View>
  );
}
