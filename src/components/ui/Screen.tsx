import React, { useEffect } from "react";
import { Platform, ScrollView, StyleSheet, View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/providers/ThemeProvider";

interface ScreenProps extends ViewProps {
  scroll?: boolean;
  // WCAG 2.4.2 "Page Titled" (Level A) — found by an axe-core audit
  // across every screen in this app, all failing identically: Expo
  // Router's Slot-based layout (no Stack navigator here) never sets
  // document.title on web, so every page showed the same generic
  // bundler-default tab title with no way for a screen reader or
  // multi-tab user to tell pages apart. Native has no equivalent
  // concept without a Stack header, so this only touches web.
  title?: string;
}

export function Screen({ scroll = false, style, children, title, ...rest }: ScreenProps) {
  const { theme } = useTheme();
  const Container = scroll ? ScrollView : View;

  useEffect(() => {
    if (Platform.OS === "web") {
      document.title = title ? `${title} – Campus` : "Campus";
    }
  }, [title]);

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
