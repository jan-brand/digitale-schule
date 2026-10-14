import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { TopBar } from "@/components/layout/TopBar";
import { ADMIN_ITEMS, SETTINGS_ITEM, buildNavItems } from "@/components/navigation/navItems";

// Mobile breakpoint per doc/UI_UX_SPECIFICATION.md §4 ("< 768 dp/CSS px").
// The spec's three-way split (mobile/tablet/desktop) is simplified here
// to two (mobile bottom-nav vs. sidebar for everything >= 768) — tablet
// gets the same collapsible sidebar as desktop rather than its own
// temporary-overlay variant; a documented scope simplification, not an
// oversight, given the time available for this ticket.
const MOBILE_BREAKPOINT = 768;

interface AppShellProps {
  title: string;
  hasAdminAccess: boolean;
  children: React.ReactNode;
}

export function AppShell({ title, hasAdminAccess, children }: AppShellProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_BREAKPOINT;

  const items = buildNavItems(hasAdminAccess);
  const moreItems = hasAdminAccess ? [...ADMIN_ITEMS, SETTINGS_ITEM] : [SETTINGS_ITEM];

  if (isMobile) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <TopBar title={title} />
        <View style={{ flex: 1 }}>{children}</View>
        <BottomNavigation moreItems={moreItems} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Sidebar items={items} />
      <View style={{ flex: 1 }}>
        <TopBar title={title} />
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
});
