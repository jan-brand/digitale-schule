import { useCallback, useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { AuditEvent, listAuditEvents } from "@/features/academic/academicApi";

// SCR-17 (doc/UI_UX_SPECIFICATION.md §5): data-minimized audit list
// with a filter; the "Pflichtbegründung" shown here was already
// required server-side at write time (fn_write_audit_event is only
// ever called from inside the SECURITY DEFINER functions that enforce
// it) — this screen only displays audit_events, it has no write path
// of its own (no client INSERT/UPDATE/DELETE grant exists on this
// table at all).
export default function AuditScreen() {
  const { theme } = useTheme();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    listAuditEvents()
      .then(setEvents)
      .catch(() => setError("Auditliste konnte nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) => e.action.toLowerCase().includes(q) || e.targetType.toLowerCase().includes(q) || e.outcome.toLowerCase().includes(q),
    );
  }, [events, filter]);

  return (
    <Screen scroll>
      <Text variant="title">Audit</Text>
      <Text variant="caption" style={{ marginTop: theme.spacing.xs }}>
        Letzte {events.length} Einträge, nur diese Schule. Nur Aktion, Zielart, Ergebnis und Begründung — keine
        zusätzlichen personenbezogenen Daten.
      </Text>

      <View style={{ marginTop: theme.spacing.md }}>
        <Input label="Filtern (Aktion, Zielart, Ergebnis)" value={filter} onChangeText={setFilter} />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={reload} /> : null}
        {!loading && !error && filtered.length === 0 ? <EmptyState message="Keine Einträge gefunden." /> : null}
        {!loading && !error
          ? filtered.map((e) => (
              <Card key={e.id} style={{ marginBottom: theme.spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>{e.action}</Text>
                  <Badge label={e.outcome} tone={e.outcome === "success" ? "success" : "danger"} />
                </View>
                <Text variant="caption">{`${e.targetType} · ${new Date(e.occurredAt).toLocaleString("de-DE")}`}</Text>
                {e.reason ? <Text variant="caption">{e.reason}</Text> : null}
              </Card>
            ))
          : null}
      </View>
    </Screen>
  );
}
