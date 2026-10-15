import { supabase } from "@/lib/supabase";
import { CampusError } from "@/lib/errors";
import { CsvImportRow } from "@/features/identity/csv";

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

export interface PermissionCatalogEntry {
  id: string;
  code: string;
  sensitivity: string;
  delegationClass: string;
}

// permissions is a fixed, system-managed catalog (doc/DATA_MODEL.md) —
// readable by any active member (permissions_select_all), never
// client-writable.
export async function listPermissionCatalog(): Promise<PermissionCatalogEntry[]> {
  const { data, error } = await supabase
    .from("permissions")
    .select("id, code, sensitivity, delegation_class")
    .order("code");
  if (error) throw toCampusError(error, "Berechtigungskatalog konnte nicht geladen werden.");
  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    sensitivity: row.sensitivity,
    delegationClass: row.delegation_class,
  }));
}

export interface PermissionGrant {
  id: string;
  membershipId: string;
  firstName: string;
  lastName: string;
  permissionCode: string;
  reason: string;
  grantedAt: string;
}

interface PermissionGrantRow {
  id: string;
  membership_id: string;
  reason: string;
  granted_at: string;
  permissions: { code: string } | null;
  school_memberships: { profiles: { first_name: string; last_name: string } | null } | null;
}

// Active grants only (revoked_at is null) — same own-row-or-admin RLS
// as everything else in this module; a non-admin only ever sees their
// own grants here.
export async function listPermissionGrants(): Promise<PermissionGrant[]> {
  const { data, error } = await supabase
    .from("permission_grants")
    .select(
      "id, membership_id, reason, granted_at, permissions(code), school_memberships(profiles(first_name, last_name))",
    )
    .is("revoked_at", null)
    .order("granted_at", { ascending: false })
    .returns<PermissionGrantRow[]>();
  if (error) throw toCampusError(error, "Zusatzrechte konnten nicht geladen werden.");
  return (data ?? []).map((row) => ({
    id: row.id,
    membershipId: row.membership_id,
    firstName: row.school_memberships?.profiles?.first_name ?? "",
    lastName: row.school_memberships?.profiles?.last_name ?? "",
    permissionCode: row.permissions?.code ?? "",
    reason: row.reason,
    grantedAt: row.granted_at,
  }));
}

// Verfahren B (D-011/D-012): a teacher issues a one-time code for a
// student in their own school and relays it out-of-band — never
// emailed. fn_issue_teacher_reset_code re-checks the caller's standing
// and the target's role itself; this is a thin wrapper, not the
// authorization boundary.
export async function issueTeacherResetCode(targetProfileId: string, reason: string): Promise<string> {
  const { data, error } = await supabase.rpc("fn_issue_teacher_reset_code", {
    p_target_profile_id: targetProfileId,
    p_reason: reason,
  });
  if (error || !data) throw toCampusError(error, "Reset-Code konnte nicht erzeugt werden.");
  return data;
}

// --- CSV-Import (M5 part 2) -------------------------------------------
// Staging/confirming are plain RPC calls (no service-role needed); only
// the actual account creation inside admin-import-csv-process needs the
// Admin API, so only that step is an Edge Function — see
// supabase/migrations/20261014240001_m5_csv_import.sql.

export interface ImportJobRow {
  rowNumber: number;
  validationState: "pending" | "valid" | "error" | "imported";
  errorCode: string | null;
  rowData: CsvImportRow;
}

export async function stageCsvImport(rows: CsvImportRow[], reason: string): Promise<string> {
  const { data, error } = await supabase.rpc("fn_stage_csv_import", {
    p_rows: rows,
    p_reason: reason,
  });
  if (error || !data) throw toCampusError(error, "Import konnte nicht vorbereitet werden.");
  return data;
}

interface ImportJobRowDb {
  row_number: number;
  validation_state: ImportJobRow["validationState"];
  error_code: string | null;
  row_data: CsvImportRow;
}

export async function listImportJobRows(jobId: string): Promise<ImportJobRow[]> {
  const { data, error } = await supabase
    .from("import_job_rows")
    .select("row_number, validation_state, error_code, row_data")
    .eq("job_id", jobId)
    .order("row_number")
    .returns<ImportJobRowDb[]>();

  if (error) throw toCampusError(error, "Importvorschau konnte nicht geladen werden.");
  return (data ?? []).map((row) => ({
    rowNumber: row.row_number,
    validationState: row.validation_state,
    errorCode: row.error_code,
    rowData: row.row_data,
  }));
}

export interface ProcessImportResult {
  imported: number;
  failed: number;
}

export async function confirmAndProcessCsvImport(jobId: string): Promise<ProcessImportResult> {
  const { data, error } = await supabase.functions.invoke<ProcessImportResult | { error: string }>(
    "admin-import-csv-process",
    { body: { jobId } },
  );
  if (error || !data || "error" in data) {
    throw new CampusError("unauthorized", "Import konnte nicht ausgeführt werden.");
  }
  return data;
}
