import { supabase } from "@/lib/supabase";
import { CampusError } from "@/lib/errors";

// Typed wrappers for M4's privileged member-management operations.
// Everything except inviteUser calls a SECURITY DEFINER Postgres
// function directly (supabase.rpc) — those functions already enforce
// every authorization rule themselves (self-escalation, principal-is-
// CLI-only, last-admin protection, mandatory reason + atomic audit; see
// supabase/migrations/20261013220006_rls_policies.sql,
// 20261014090001_security_hardening_and_tenant_fix.sql,
// 20261014210001_m4_user_management.sql). inviteUser alone goes through
// the admin-invite-user Edge Function, because creating the auth.users
// row itself requires the service-role key, which must never reach this
// client (doc/SECURITY_AUTH.md).

export type RoleCode = "student" | "teacher" | "parent" | "secretariat" | "school_admin" | "principal";

export interface SchoolMember {
  membershipId: string;
  profileId: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: RoleCode[];
}

export interface InviteUserParams {
  firstName: string;
  lastName: string;
  roleCode: RoleCode;
  reason: string;
  password?: string;
}

export interface InviteUserResult {
  profileId: string;
  username: string;
  initialPassword?: string;
}

function toCampusError(error: unknown, fallback: string): CampusError {
  return new CampusError("unknown_error", error instanceof Error ? error.message : fallback);
}

export async function inviteUser(params: InviteUserParams): Promise<InviteUserResult> {
  const { data, error } = await supabase.functions.invoke<InviteUserResult | { error: string }>(
    "admin-invite-user",
    {
      body: {
        firstName: params.firstName,
        lastName: params.lastName,
        roleCode: params.roleCode,
        reason: params.reason,
        password: params.password,
      },
    },
  );

  if (error || !data || "error" in data) {
    throw new CampusError("unauthorized", "Einladung fehlgeschlagen.");
  }
  return data;
}

interface MemberRow {
  id: string;
  status: string;
  profiles: { id: string; first_name: string; last_name: string } | null;
  role_assignments: { revoked_at: string | null; roles: { code: RoleCode } | null }[] | null;
}

// No school_id parameter: RLS (school_memberships_select_own_or_admin)
// already restricts this to "my own row" plus, for an admin/principal,
// every row in the one school they administer — there is no
// cross-school admin role to filter against (D-002).
export async function listMembers(): Promise<SchoolMember[]> {
  const { data, error } = await supabase
    .from("school_memberships")
    .select(
      "id, status, profiles(id, first_name, last_name), role_assignments(revoked_at, roles(code))",
    )
    .returns<MemberRow[]>();

  if (error) {
    throw toCampusError(error, "Mitglieder konnten nicht geladen werden.");
  }

  return (data ?? []).map((row) => ({
    membershipId: row.id,
    profileId: row.profiles?.id ?? "",
    firstName: row.profiles?.first_name ?? "",
    lastName: row.profiles?.last_name ?? "",
    status: row.status,
    roles: (row.role_assignments ?? [])
      .filter((ra) => ra.revoked_at === null)
      .map((ra) => ra.roles?.code)
      .filter((code): code is RoleCode => Boolean(code)),
  }));
}

export async function assignRole(membershipId: string, roleCode: RoleCode, reason: string): Promise<void> {
  const { error } = await supabase.rpc("fn_assign_role", {
    p_target_membership_id: membershipId,
    p_role_code: roleCode,
    p_reason: reason,
  });
  if (error) throw toCampusError(error, "Rolle konnte nicht zugewiesen werden.");
}

export async function revokeRole(roleAssignmentId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("fn_revoke_role", {
    p_role_assignment_id: roleAssignmentId,
    p_reason: reason,
  });
  if (error) throw toCampusError(error, "Rolle konnte nicht entzogen werden.");
}

export async function suspendMembership(membershipId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("fn_update_membership_status", {
    p_membership_id: membershipId,
    p_new_status: "suspended",
    p_reason: reason,
  });
  if (error) throw toCampusError(error, "Mitgliedschaft konnte nicht gesperrt werden.");
}

export async function reactivateMembership(membershipId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("fn_update_membership_status", {
    p_membership_id: membershipId,
    p_new_status: "active",
    p_reason: reason,
  });
  if (error) throw toCampusError(error, "Mitgliedschaft konnte nicht reaktiviert werden.");
}

export async function setUsername(profileId: string, newUsername: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("fn_set_username", {
    p_profile_id: profileId,
    p_new_username: newUsername,
    p_reason: reason,
  });
  if (error) throw toCampusError(error, "Benutzername konnte nicht geändert werden.");
}

export async function grantPermission(
  membershipId: string,
  permissionCode: string,
  reason: string,
): Promise<void> {
  const { error } = await supabase.rpc("fn_grant_permission", {
    p_target_membership_id: membershipId,
    p_permission_code: permissionCode,
    p_reason: reason,
  });
  if (error) throw toCampusError(error, "Zusatzrecht konnte nicht vergeben werden.");
}

export async function revokePermission(permissionGrantId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("fn_revoke_permission", {
    p_permission_grant_id: permissionGrantId,
    p_reason: reason,
  });
  if (error) throw toCampusError(error, "Zusatzrecht konnte nicht entzogen werden.");
}
