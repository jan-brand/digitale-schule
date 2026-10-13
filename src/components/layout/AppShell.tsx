import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";

const WIDE_BREAKPOINT = 768;

interface AppShellProps {
  nav: React.ReactNode;
  children: React.ReactNode;
}

// Minimal responsive shell: a side rail on wide viewports (web/tablet), a
// top bar otherwise. Real role-aware navigation items are added in
// src/components/navigation/RoleNav (Phase F3, doc/PROJECT_PLAN.md).
export function AppShell({ nav, children }: AppShellProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  return (
    <View style={[styles.root, { flexDirection: isWide ? "row" : "column" }]}>
      <View
        style={[
          isWide ? styles.sideRail : styles.topBar,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {nav}
      </View>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  sideRail: {
    width: 240,
  },
  topBar: {
    width: "100%",
  },
});
