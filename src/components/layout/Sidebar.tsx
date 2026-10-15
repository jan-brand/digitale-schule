import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { NavItem } from "@/components/navigation/NavItem";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { NavItem as NavItemType } from "@/components/navigation/navItems";

const STORAGE_KEY = "campus.sidebarCollapsed";
const EXPANDED_WIDTH = 256;
const COLLAPSED_WIDTH = 72;

// Desktop/tablet sidebar (doc/UI_UX_SPECIFICATION.md §4 "Desktop"):
// collapsible, state persisted per device (UX-DEC-11: harmless
// preference, autosave — no explicit save step needed). Collapsed icons
// still need an accessible name (§4), so collapsed mode shows the first
// letter of the label rather than a true icon set (none exists yet).
export function Sidebar({ items }: { items: NavItemType[] }) {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => setCollapsed(stored === "true"))
      .finally(() => setHydrated(true));
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => {});
  }

  if (!hydrated) {
    return null;
  }

  return (
    <View
      style={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        borderRightWidth: 1,
        borderRightColor: theme.colors.accent,
        paddingVertical: theme.spacing.md,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={collapsed ? "Seitenleiste ausklappen" : "Seitenleiste einklappen"}
        onPress={toggle}
        style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.sm }}
      >
        <Text variant="caption">{collapsed ? "»" : "« Einklappen"}</Text>
      </Pressable>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href.replace("/(app)", ""));
        return (
          <NavItem
            key={item.key}
            label={collapsed ? item.label.charAt(0) : item.label}
            accessibilityLabel={item.label}
            active={active}
            onPress={() => router.push(item.href as never)}
          />
        );
      })}
    </View>
  );
}
