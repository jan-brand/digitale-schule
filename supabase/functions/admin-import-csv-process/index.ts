// POST { jobId } -> { imported: number, failed: number } | 4xx { error }
// Authorization: Bearer <the calling admin's own access token>
//
// Processes a staged CSV import job (supabase/migrations/
// 20261014240001_m5_csv_import.sql). fn_confirm_csv_import does the
// authorization + atomic double-execution-protection claim and hands
// back only the valid rows; this function then creates one account per
// row the same way admin-invite-user does for a single invite (Admin
// API for the auth.users row, fn_finalize_invite + fn_assign_role via
// the caller's own forwarded JWT so their real authorization applies to
// every row, not just the job as a whole). No passwords are ever read
// from the CSV — a random one is generated per account, same as
// admin-invite-user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { sql } from "../_shared/db.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface ProcessRequest {
  jobId?: unknown;
}

interface ConfirmedRow {
  row_number: number;
  first_name: string;
  last_name: string;
  role_code: string;
  class_name: string | null;
}

function randomPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "x");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 });
  }
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), { status: 500 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  let body: ProcessRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_body" }), { status: 400 });
  }
  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  if (!jobId) {
    return new Response(JSON.stringify({ error: "missing_job_id" }), { status: 400 });
  }

  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: rows, error: confirmError } = await callerClient.rpc("fn_confirm_csv_import", {
    p_job_id: jobId,
    p_reason: "CSV-Import bestätigt",
  });

  if (confirmError || !rows) {
    return new Response(JSON.stringify({ error: "import_not_confirmable" }), { status: 403 });
  }

  const schoolRows = await sql<{ school_id: string }[]>`
    select school_id from public.import_jobs where id = ${jobId}
  `;
  const schoolId = schoolRows[0]?.school_id;

  let imported = 0;
  let failed = 0;

  for (const row of rows as ConfirmedRow[]) {
    const technicalEmail = `u-${crypto.randomUUID()}@accounts.campus.internal`;

    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        email: technicalEmail,
        password: randomPassword(),
        email_confirm: true,
        user_metadata: { school_id: schoolId, first_name: row.first_name, last_name: row.last_name },
      }),
    });

    if (createRes.status !== 200 && createRes.status !== 201) {
      failed++;
      await callerClient.rpc("fn_record_csv_import_row_result", {
        p_job_id: jobId,
        p_row_number: row.row_number,
        p_result_profile_id: null,
        p_error_code: "auth_create_failed",
      });
      continue;
    }
    const created = await createRes.json();
    const newUserId = created.id as string;

    const { data: finalizeData, error: finalizeError } = await callerClient.rpc("fn_finalize_invite", {
      p_new_user_id: newUserId,
      p_first_name: row.first_name,
      p_last_name: row.last_name,
      p_reason: "CSV-Import",
    });

    if (finalizeError || !finalizeData || finalizeData.length === 0) {
      failed++;
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${newUserId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
      }).catch(() => {});
      await callerClient.rpc("fn_record_csv_import_row_result", {
        p_job_id: jobId,
        p_row_number: row.row_number,
        p_result_profile_id: null,
        p_error_code: "membership_create_failed",
      });
      continue;
    }

    const { membership_id: membershipId } = finalizeData[0];

    const { error: assignError } = await callerClient.rpc("fn_assign_role", {
      p_target_membership_id: membershipId,
      p_role_code: row.role_code,
      p_reason: "CSV-Import",
    });

    if (assignError) {
      failed++;
      await callerClient.rpc("fn_record_csv_import_row_result", {
        p_job_id: jobId,
        p_row_number: row.row_number,
        p_result_profile_id: newUserId,
        p_error_code: "role_assignment_failed",
      });
      continue;
    }

    // Class-roster assignment (M10): resolve the validated class_name to
    // a class_id and link it via class_memberships, using the caller's
    // own forwarded JWT so RLS (classes.manage/school_admin) applies —
    // same as every other write in this loop. If the caller only holds
    // memberships.invite (not classes.manage), this insert is rejected
    // by RLS; that's treated as non-fatal — the account itself was
    // already created successfully, only the roster link is skipped.
    if (row.class_name) {
      const { data: classRow } = await callerClient
        .from("classes")
        .select("id")
        .eq("school_id", schoolId)
        .eq("name", row.class_name)
        .maybeSingle();
      if (classRow) {
        const { error: rosterError } = await callerClient
          .from("class_memberships")
          .insert({ school_id: schoolId, class_id: classRow.id, membership_id: membershipId });
        if (rosterError) {
          console.error(`class_memberships insert failed for row ${row.row_number}: ${rosterError.message}`);
        }
      }
    }

    imported++;
    await callerClient.rpc("fn_record_csv_import_row_result", {
      p_job_id: jobId,
      p_row_number: row.row_number,
      p_result_profile_id: newUserId,
      p_error_code: null,
    });
  }

  await callerClient.rpc("fn_finish_csv_import_job", {
    p_job_id: jobId,
    p_reason: `Import abgeschlossen: ${imported} erfolgreich, ${failed} fehlgeschlagen`,
  });

  return new Response(JSON.stringify({ imported, failed }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
