import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface SearchResult {
  id: string;
  label: string;
  kind: "member" | "class";
}

interface MemberRow {
  profiles: { first_name: string; last_name: string } | null;
}

// M10 global search (UX-DEC-07) — covers members and classes, the two
// entities that actually exist and are queryable with a name right
// now. Both queries go through the ordinary Supabase client, so the
// existing RLS policies (school_memberships_select_own_or_admin,
// classes_select_member) decide what each caller actually gets back —
// a non-admin searching members only ever gets their own row, same as
// admin/users.tsx already relies on.
export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      supabase
        .from("school_memberships")
        .select("id, profiles(first_name, last_name)")
        .or(`first_name.ilike.%${trimmed}%,last_name.ilike.%${trimmed}%`, { foreignTable: "profiles" })
        .limit(10)
        .returns<(MemberRow & { id: string })[]>(),
      supabase.from("classes").select("id, name").ilike("name", `%${trimmed}%`).limit(10),
    ])
      .then(([memberRes, classRes]) => {
        if (cancelled) return;
        const memberResults: SearchResult[] = (memberRes.data ?? []).map((row) => ({
          id: row.id,
          label: `${row.profiles?.first_name ?? ""} ${row.profiles?.last_name ?? ""}`.trim(),
          kind: "member",
        }));
        const classResults: SearchResult[] = (classRes.data ?? []).map((row) => ({
          id: row.id,
          label: row.name,
          kind: "class",
        }));
        setResults([...memberResults, ...classResults]);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return { results, loading };
}
