import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { supabase } from "@/lib/supabase";

interface SchoolInfo {
  name: string;
  status: string;
}

// SCR-05 (doc/UI_UX_SPECIFICATION.md §5): own school's name and
// released basic metadata. RLS (schools_select_member) already scopes
// this to a school the caller is an active member of — there is no
// school picker, since D-004 means there is only ever one.
export default function SchoolScreen() {
  const { theme } = useTheme();
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    supabase
      .from("schools")
      .select("name, status")
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError("Schulinformationen konnten nicht geladen werden.");
        } else {
          setSchool(data);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen title="Mein Campus">
      <Text variant="title">Schule</Text>
      <Card style={{ marginTop: theme.spacing.lg }}>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && school ? (
          <>
            <Text>{school.name}</Text>
            <Text variant="caption">Status: {school.status}</Text>
          </>
        ) : null}
        {!loading && !error && !school ? (
          <Text variant="caption">Keine Schulinformationen verfügbar.</Text>
        ) : null}
      </Card>
    </Screen>
  );
}
