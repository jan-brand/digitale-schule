import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { Text } from "@/components/ui/Text";

interface NavItemProps {
  label: string;
  /** Full accessible name — required when `label` is visually truncated
   * (e.g. a collapsed sidebar showing just an initial), per
   * doc/UI_UX_SPECIFICATION.md §4: "Eingeklappte Icons erhalten ...
   * eindeutigen Accessibility-Namen." Defaults to `label`. */
  accessibilityLabel?: string;
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

// Generic nav row used by both the Sidebar and BottomNavigation/MoreMenu
// (doc/UI_UX_SPECIFICATION.md §3/§4/§8). Which items appear at all is
// decided by src/components/navigation/navItems.ts based on the
// caller's own roles — purely a UX convenience; the server
// independently re-authorizes every route regardless.
export function NavItem({ label, accessibilityLabel, active = false, disabled = false, onPress }: NavItemProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={{
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <View style={active ? { borderLeftWidth: 3, borderLeftColor: theme.colors.action, paddingLeft: theme.spacing.sm } : undefined}>
        <Text style={{ fontWeight: active ? "600" : "400" }}>
          {label}
          {disabled ? " (bald verfügbar)" : ""}
        </Text>
      </View>
    </Pressable>
  );
}
