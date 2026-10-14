import { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { DashboardWidget, WidgetSize } from "@/components/ui/DashboardWidget";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { supabase } from "@/lib/supabase";

// W-04 "Verwaltung" (doc/UI_UX_SPECIFICATION.md §6.2/§6.3) — only
// rendered by the dashboard when the caller has admin access; the
// member count itself is also independently RLS-scoped (admin-only
// select policy on school_memberships), so even a client bug showing
// this widget to the wrong user would return zero rows, not real data.
export function AdministrationWidget({ size, controls }: { size: WidgetSize; controls?: React.ReactNode }) {
  const { theme } = useTheme();
  const router = useRouter();
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("school_memberships")
      .select("id", { count: "exact", head: true })
      .then(({ count, error: queryError }) => {
        if (queryError) {
          setError("Kennzahlen konnten nicht geladen werden.");
        } else {
          setMemberCount(count ?? 0);
        }
        setLoading(false);
      });
  }, []);

  return (
    <DashboardWidget title="Verwaltung" size={size} controls={controls}>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error ? <Text variant="caption">{memberCount} Mitglieder an der Schule</Text> : null}
      <View style={{ flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.sm, flexWrap: "wrap" }}>
        <Button label="Mitgliederverwaltung" variant="secondary" onPress={() => router.push("/(app)/admin/users" as never)} />
        <Button label="CSV-Import" variant="secondary" onPress={() => router.push("/(app)/admin/import" as never)} />
      </View>
    </DashboardWidget>
  );
}
