import React, { useId, useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { Text } from "./Text";

interface InputProps extends TextInputProps {
  label: string;
  errorMessage?: string;
}

export function Input({ label, errorMessage, style, ...rest }: InputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const inputId = useId();
  const hasError = Boolean(errorMessage);

  return (
    <View style={styles.wrapper}>
      <Text nativeID={`${inputId}-label`} style={{ marginBottom: theme.spacing.xs }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityLabelledBy={`${inputId}-label`}
        accessibilityState={{ disabled: rest.editable === false }}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        placeholderTextColor={theme.colors.text + "80"}
        style={[
          {
            borderRadius: theme.radius.card,
            borderWidth: focused ? 2 : 1,
            borderColor: hasError ? "#D92D20" : theme.colors.action,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            padding: theme.spacing.sm,
          },
          style,
        ]}
        {...rest}
      />
      {hasError ? (
        <Text accessibilityLiveRegion="polite" style={{ color: "#D92D20", marginTop: theme.spacing.xs }}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
});
