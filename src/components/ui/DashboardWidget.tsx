import React from "react";
import { DimensionValue, View } from "react-native";
import { Card } from "./Card";
import { Text } from "./Text";
import { useTheme } from "@/providers/ThemeProvider";

export type WidgetSize = "small" | "large";

interface DashboardWidgetProps {
  title: string;
  size: WidgetSize;
  children: React.ReactNode;
  /** Edit controls (move/resize/hide) when the dashboard is in
   * customize mode — doc/UI_UX_SPECIFICATION.md §6.5. Omit for
   * non-personalizable widgets (W-01, active W-06). */
  controls?: React.ReactNode;
}

const WIDTH: Record<WidgetSize, DimensionValue> = {
  small: 280,
  large: "100%",
};

// doc/UI_UX_SPECIFICATION.md §6.2/§8: a single card shape every
// Foundation widget (W-01..W-06) renders through, so size handling and
// edit-mode controls live in one place rather than duplicated per
// widget.
export function DashboardWidget({ title, size, children, controls }: DashboardWidgetProps) {
  const { theme } = useTheme();
  return (
    <Card style={{ width: WIDTH[size], marginBottom: theme.spacing.md }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="body" accessibilityRole="header">
          {title}
        </Text>
        {controls}
      </View>
      <View style={{ marginTop: theme.spacing.sm }}>{children}</View>
    </Card>
  );
}
