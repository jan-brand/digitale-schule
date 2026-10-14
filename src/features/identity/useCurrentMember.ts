import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { RoleCode } from "@/features/identity/adminApi";

export interface CurrentMember {
  membershipId: string;
  schoolId: string;
  schoolName: string;
  firstName: string;
  lastName: string;
  status: string;
  contactEmail: string | null;
  contactEmailVerifiedAt: string | null;
  roles: RoleCode[];
  hasAdminAccess: boolean;
}

interface CurrentMemberRow {
  id: string;
  school_id: string;
  status: string;
  schools: { name: string } | null;
  profiles: {
    first_name: string;
    last_name: string;
    contact_email: string | null;
    contact_email_verified_at: string | null;
  } | null;
  role_assignments: { revoked_at: string | null; roles: { code: RoleCode } | null }[] | null;
}

// Own-row-only query (D-002: one account, one school — there is nothing
// to disambiguate). Used for role-aware navigation (doc/UI_UX_
// SPECIFICATION.md §3 "Navigation nach Rollen") — this is UX only; the
// server/RLS independently enforces every actual permission regardless
// of what this hook returns (doc/ARCHITECTURE.md: client context is
// never an authorization proof).
export function useCurrentMember() {
  const { session } = useAuth();
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setMember(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    supabase
      .from("school_memberships")
      .select(
        "id, school_id, status, schools(name), profiles(first_name, last_name, contact_email, contact_email_verified_at), role_assignments(revoked_at, roles(code))",
      )
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (!data) {
          setMember(null);
          setLoading(false);
          return;
        }
        const row = data as unknown as CurrentMemberRow;
        const roles = (row.role_assignments ?? [])
          .filter((ra) => ra.revoked_at === null)
          .map((ra) => ra.roles?.code)
          .filter((code): code is RoleCode => Boolean(code));

        setMember({
          membershipId: row.id,
          schoolId: row.school_id,
          schoolName: row.schools?.name ?? "",
          firstName: row.profiles?.first_name ?? "",
          lastName: row.profiles?.last_name ?? "",
          status: row.status,
          contactEmail: row.profiles?.contact_email ?? null,
          contactEmailVerifiedAt: row.profiles?.contact_email_verified_at ?? null,
          roles,
          hasAdminAccess: roles.includes("school_admin") || roles.includes("principal"),
        });
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  return { member, loading };
}
