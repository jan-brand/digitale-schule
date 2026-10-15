import React, { useState } from "react";
import { ActivityIndicator, Pressable, PressableProps, StyleSheet } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { Text } from "./Text";

interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

const DANGER_COLOR = "#D92D20";

export function Button({
  label,
  loading = false,
  variant = "primary",
  disabled,
  ...rest
}: ButtonProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const isDisabled = disabled || loading;

  const accentColor = variant === "danger" ? DANGER_COLOR : theme.colors.action;
  const backgroundColor = variant === "primary" ? theme.colors.action : variant === "danger" ? DANGER_COLOR : "transparent";
  const textColor = variant === "secondary" ? theme.colors.action : theme.colors.surface;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderRadius: theme.radius.card,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          borderWidth: variant === "secondary" || focused ? (focused ? 2 : 1) : 0,
          borderColor: accentColor,
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={{ color: textColor, fontWeight: "600" }}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
});
