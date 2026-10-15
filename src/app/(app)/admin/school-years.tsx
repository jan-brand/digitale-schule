import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { SchoolYear, createSchoolYear, listSchoolYears } from "@/features/academic/academicApi";

// SCR-12 (doc/UI_UX_SPECIFICATION.md §5): list + create. No "active
// period" toggle yet — Foundation v0.1 has no column for it
// (school_years has no `is_active`/status), so classes.tsx's school-
// year picker just shows all of them; marking one active is a later
// Fachmodul concern, not invented here.
export default function SchoolYearsScreen() {
  const { theme } = useTheme();
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    listSchoolYears()
      .then(setYears)
      .catch(() => setError("Schuljahre konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  async function handleCreate() {
    setCreateError(null);
    setCreating(true);
    try {
      await createSchoolYear(name, startsOn, endsOn);
      setName("");
      setStartsOn("");
      setEndsOn("");
      reload();
    } catch {
      setCreateError("Schuljahr konnte nicht angelegt werden. Bitte Berechtigung und Daten prüfen.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Screen scroll title="Schuljahre">
      <Text variant="title">Schuljahre</Text>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text variant="body">Neues Schuljahr</Text>
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
          <Input label="Bezeichnung (z. B. 2026/2027)" value={name} onChangeText={setName} />
          <Input label="Beginn (JJJJ-MM-TT)" value={startsOn} onChangeText={setStartsOn} placeholder="2026-08-01" />
          <Input label="Ende (JJJJ-MM-TT)" value={endsOn} onChangeText={setEndsOn} placeholder="2027-07-31" />
          <Button
            label="Anlegen"
            onPress={handleCreate}
            loading={creating}
            disabled={!name.trim() || !startsOn.trim() || !endsOn.trim()}
          />
          {createError ? <Text style={{ color: "#D92D20" }}>{createError}</Text> : null}
        </View>
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={reload} /> : null}
        {!loading && !error && years.length === 0 ? (
          <EmptyState message="Keine Schuljahre angelegt." />
        ) : null}
        {!loading && !error
          ? years.map((year) => (
              <Card key={year.id} style={{ marginBottom: theme.spacing.sm }}>
                <Text>{year.name}</Text>
                <Text variant="caption">{`${year.startsOn} – ${year.endsOn}`}</Text>
              </Card>
            ))
          : null}
      </View>
    </Screen>
  );
}
