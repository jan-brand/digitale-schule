import React from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { Text } from "@/components/ui/Text";

interface NavItemProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

// Generic nav row. Role-filtered navigation (which items a role sees, and
// which out-of-scope modules render disabled) lives in RoleNav, added in
// Phase F3 once roles/active-school context exist (doc/PROJECT_PLAN.md).
export function NavItem({ label, active = false, disabled = false, onPress }: NavItemProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
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
