import { useEffect, useState } from "react";
import { DashboardWidget } from "@/components/ui/DashboardWidget";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Text } from "@/components/ui/Text";
import { supabase } from "@/lib/supabase";

interface SchoolInfo {
  name: string;
  status: string;
}

// W-01 "Mein Campus" — always visible, never personalizable, never a
// school switch (doc/UI_UX_SPECIFICATION.md §6.1/§6.2).
export function MyCampusWidget() {
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
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
  }

  useEffect(load, []);

  return (
    <DashboardWidget title="Mein Campus" size="large">
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? <Text>{school?.name ?? "Keine Schulinformationen verfügbar."}</Text> : null}
    </DashboardWidget>
  );
}
