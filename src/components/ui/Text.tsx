import React from "react";
import { Text as RNText, TextProps as RNTextProps } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

interface TextProps extends RNTextProps {
  variant?: "body" | "title" | "caption";
}

const fontSize: Record<NonNullable<TextProps["variant"]>, number> = {
  title: 22,
  body: 16,
  caption: 13,
};

export function Text({ variant = "body", style, ...rest }: TextProps) {
  const { theme } = useTheme();
  return (
    <RNText
      style={[
        { color: theme.colors.text, fontSize: fontSize[variant] },
        variant === "title" ? { fontWeight: "600" } : null,
        style,
      ]}
      {...rest}
    />
  );
}
