    // Hand-written placeholder for Supabase's generated database types.
//
// Run `npm run db:types` with SUPABASE_DB_URL pointing at a reachable
// Postgres instance to regenerate this properly — blocked in this
// environment because `supabase gen types typescript` needs Docker even
// with `--db-url`, which isn't available here.
//
// Only the `Functions` entries actually called from the app
// (src/features/identity/adminApi.ts, src/features/auth/api.ts) are
// declared, by hand, matching their real SQL signatures exactly (see
// supabase/migrations/20261013220006_rls_policies.sql,
// 20261014090001_security_hardening_and_tenant_fix.sql,
// 20261014210001_m4_user_management.sql) — enough for supabase-js's
// `.rpc()` to type-check without inventing table/row shapes we haven't
// verified.
//
// `Tables` entries are added only for tables the app directly
// `.insert()`/`.update()`s rather than going through `.rpc()`/
// `.returns<T>()` reads — academic structure is RLS-protected direct
// writes by design (see that same migration's comment), so M10/M12's
// school_years/classes/class_staff_assignments/class_memberships/
// subjects/courses/course_memberships inserts need real column types
// here, hand-matched to
// supabase/migrations/20261013220004_academic_structure.sql and
// 20261014250001_m10_class_rosters.sql.

export type Database = {
  public: {
    Tables: {
      school_years: {
        Row: { id: string; school_id: string; name: string; starts_on: string; ends_on: string; created_at: string };
        Insert: { id?: string; school_id: string; name: string; starts_on: string; ends_on: string; created_at?: string };
        Update: Partial<{ id: string; school_id: string; name: string; starts_on: string; ends_on: string; created_at: string }>;
      };
      classes: {
        Row: { id: string; school_id: string; school_year_id: string; name: string; created_at: string };
        Insert: { id?: string; school_id: string; school_year_id: string; name: string; created_at?: string };
        Update: Partial<{ id: string; school_id: string; school_year_id: string; name: string; created_at: string }>;
      };
      class_staff_assignments: {
        Row: {
          id: string;
          school_id: string;
          class_id: string;
          membership_id: string;
          assignment_type: string;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          class_id: string;
          membership_id: string;
          assignment_type?: string;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: Partial<{ ended_at: string | null }>;
      };
      class_memberships: {
        Row: { id: string; school_id: string; class_id: string; membership_id: string; started_at: string; ended_at: string | null };
        Insert: {
          id?: string;
          school_id: string;
          class_id: string;
          membership_id: string;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: Partial<{ ended_at: string | null }>;
      };
      subjects: {
        Row: { id: string; school_id: string; name: string; code: string; created_at: string };
        Insert: { id?: string; school_id: string; name: string; code: string; created_at?: string };
        Update: Partial<{ name: string; code: string }>;
      };
      courses: {
        Row: { id: string; school_id: string; school_year_id: string; subject_id: string; name: string; created_at: string };
        Insert: {
          id?: string;
          school_id: string;
          school_year_id: string;
          subject_id: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<{ name: string; subject_id: string; school_year_id: string }>;
      };
      course_memberships: {
        Row: {
          id: string;
          school_id: string;
          course_id: string;
          user_id: string;
          membership_id: string;
          membership_school_id: string;
          participant_role: "student" | "teacher";
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          course_id: string;
          user_id: string;
          membership_id: string;
          membership_school_id: string;
          participant_role: "student" | "teacher";
          created_at?: string;
        };
        Update: Partial<{ participant_role: "student" | "teacher" }>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      fn_assign_role: {
        Args: { p_target_membership_id: string; p_role_code: string; p_reason: string };
        Returns: string;
      };
      fn_revoke_role: {
        Args: { p_role_assignment_id: string; p_reason: string };
        Returns: undefined;
      };
      fn_update_membership_status: {
        Args: { p_membership_id: string; p_new_status: string; p_reason: string };
        Returns: undefined;
      };
      fn_set_username: {
        Args: { p_profile_id: string; p_new_username: string; p_reason: string };
        Returns: undefined;
      };
      fn_grant_permission: {
        Args: { p_target_membership_id: string; p_permission_code: string; p_reason: string };
        Returns: string;
      };
      fn_revoke_permission: {
        Args: { p_permission_grant_id: string; p_reason: string };
        Returns: undefined;
      };
      fn_issue_teacher_reset_code: {
        Args: { p_target_profile_id: string; p_reason: string };
        Returns: string;
      };
      fn_stage_csv_import: {
        Args: { p_rows: unknown; p_reason: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
