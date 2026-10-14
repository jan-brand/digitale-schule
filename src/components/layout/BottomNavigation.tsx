import { useRouter, usePathname } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { ALWAYS_VISIBLE_ITEMS, NavItem as NavItemType } from "@/components/navigation/navItems";

// Mobile shell (doc/UI_UX_SPECIFICATION.md §4 "Smartphone"): fixed
// bottom bar with Übersicht/Schule/Mehr; "Mehr" opens the remaining
// allowed targets (Settings, Verwaltung if authorized). Uses React
// Native's built-in Modal for the "Mehr" sheet — no new dependency, and
// a real Dialog/Sheet component (doc §8) doesn't exist yet (M8).
export function BottomNavigation({ moreItems }: { moreItems: NavItemType[] }) {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  function go(href: string) {
    setMoreOpen(false);
    router.push(href as never);
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href.replace("/(app)", ""));
  }

  return (
    <>
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: theme.colors.surface }}>
        <View
          style={{
            flexDirection: "row",
            borderTopWidth: 1,
            borderTopColor: theme.colors.accent,
          }}
        >
          {ALWAYS_VISIBLE_ITEMS.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="link"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: isActive(item.href) }}
              onPress={() => go(item.href)}
              style={{ flex: 1, alignItems: "center", paddingVertical: theme.spacing.sm }}
            >
              <Text style={{ fontWeight: isActive(item.href) ? "600" : "400" }}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Weitere Ziele anzeigen"
            onPress={() => setMoreOpen(true)}
            style={{ flex: 1, alignItems: "center", paddingVertical: theme.spacing.sm }}
          >
            <Text>Mehr</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <Modal visible={moreOpen} animationType="slide" transparent onRequestClose={() => setMoreOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
          accessibilityLabel="Schließen"
          onPress={() => setMoreOpen(false)}
        >
          <View style={{ flex: 1 }} />
        </Pressable>
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: theme.colors.surface }}>
          <View style={{ padding: theme.spacing.md, gap: theme.spacing.xs }}>
            <Text variant="body" style={{ marginBottom: theme.spacing.sm }}>
              Weitere Ziele
            </Text>
            {moreItems.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="link"
                accessibilityLabel={item.label}
                onPress={() => go(item.href)}
                style={{ paddingVertical: theme.spacing.sm }}
              >
                <Text>{item.label}</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Schließen"
              onPress={() => setMoreOpen(false)}
              style={{ paddingVertical: theme.spacing.sm }}
            >
              <Text variant="caption">Schließen</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
