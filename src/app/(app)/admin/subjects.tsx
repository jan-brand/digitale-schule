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
import { Subject, createSubject, listSubjects } from "@/features/academic/academicApi";

// SCR-14 (doc/UI_UX_SPECIFICATION.md §5): minimal list/form, same
// pattern as school-years.tsx.
export default function SubjectsScreen() {
  const { theme } = useTheme();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    listSubjects()
      .then(setSubjects)
      .catch(() => setError("Fächer konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  async function handleCreate() {
    setCreateError(null);
    setCreating(true);
    try {
      await createSubject(name, code);
      setName("");
      setCode("");
      reload();
    } catch {
      setCreateError("Fach konnte nicht angelegt werden. Bitte Berechtigung und Angaben prüfen.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Screen scroll>
      <Text variant="title">Fächer</Text>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text variant="body">Neues Fach</Text>
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
          <Input label="Name (z. B. Mathematik)" value={name} onChangeText={setName} />
          <Input label="Kürzel (z. B. MATH)" value={code} onChangeText={setCode} autoCapitalize="characters" />
          <Button label="Anlegen" onPress={handleCreate} loading={creating} disabled={!name.trim() || !code.trim()} />
          {createError ? <Text style={{ color: "#D92D20" }}>{createError}</Text> : null}
        </View>
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={reload} /> : null}
        {!loading && !error && subjects.length === 0 ? <EmptyState message="Keine Fächer angelegt." /> : null}
        {!loading && !error
          ? subjects.map((s) => (
              <Card key={s.id} style={{ marginBottom: theme.spacing.sm }}>
                <Text>{s.name}</Text>
                <Text variant="caption">{s.code}</Text>
              </Card>
            ))
          : null}
      </View>
    </Screen>
  );
}
