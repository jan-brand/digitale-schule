import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { useGlobalSearch } from "@/features/search/useGlobalSearch";

// doc/UI_UX_SPECIFICATION.md §4 "Desktop": "Topbar: Campus-Name,
// Seitentitel, Theme-/Account-Menü; kein Schulwechsel." Global search
// (UX-DEC-07) now covers members and classes (M10) — the two entities
// that actually exist with a name to search; results route to the
// existing list screens rather than a per-entity detail page, since
// none exists yet.
export function TopBar({ title }: { title: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { results, loading } = useGlobalSearch(query);

  function goTo(kind: "member" | "class") {
    setQuery("");
    router.push((kind === "member" ? "/(app)/admin/users" : "/(app)/admin/classes") as never);
  }

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.accent,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="title">{title}</Text>
        <View style={{ width: 240 }}>
          <Input label="Suche" placeholder="Mitglieder, Klassen…" value={query} onChangeText={setQuery} />
        </View>
      </View>
      {query.trim().length >= 2 ? (
        <View style={{ marginTop: theme.spacing.xs, alignSelf: "flex-end", width: 240 }}>
          {loading ? <Text variant="caption">Suche…</Text> : null}
          {!loading && results.length === 0 ? <Text variant="caption">Keine Treffer.</Text> : null}
          {!loading
            ? results.map((result) => (
                <Pressable
                  key={`${result.kind}-${result.id}`}
                  accessibilityRole="button"
                  onPress={() => goTo(result.kind)}
                  style={{ paddingVertical: theme.spacing.xs }}
                >
                  <Text style={{ color: theme.colors.action }}>
                    {`${result.kind === "member" ? "Mitglied" : "Klasse"}: ${result.label}`}
                  </Text>
                </Pressable>
              ))
            : null}
        </View>
      ) : null}
    </View>
  );
}
