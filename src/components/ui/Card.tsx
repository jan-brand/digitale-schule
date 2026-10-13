import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

export function Card({ style, children, ...rest }: ViewProps) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.card,
          padding: theme.spacing.md,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
