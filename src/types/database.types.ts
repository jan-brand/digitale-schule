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

export type Database = {
  public: {
    Tables: Record<string, never>;
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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
