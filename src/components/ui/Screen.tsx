import React from "react";
import { ScrollView, StyleSheet, View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/providers/ThemeProvider";

interface ScreenProps extends ViewProps {
  scroll?: boolean;
}

export function Screen({ scroll = false, style, children, ...rest }: ScreenProps) {
  const { theme } = useTheme();
  const Container = scroll ? ScrollView : View;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Container
        style={[styles.container, { padding: theme.spacing.md }, style]}
        {...rest}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
