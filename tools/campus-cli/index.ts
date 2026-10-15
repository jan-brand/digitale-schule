#!/usr/bin/env -S npx tsx
// Campus operator CLI — school provisioning and the privileged
// operations that are deliberately NOT reachable from the app at all
// (D-024, IAM-006, IAM-021, IAM-022): creating a school, bootstrapping
// its first school_admin, assigning/revoking the `principal` role, and
// emergency admin recovery when a school has been locked out of its own
// admin tooling. Never imported from src/app — see db.ts.
//
// Usage: npm run cli -- <command> [--flag value ...]
import { randomBytes } from "node:crypto";
import { adminCreateAuthUser, randomPassword, withClient } from "./db";

function getFlag(args: string[], name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx === -1 ? undefined : args[idx + 1];
}

function requireFlag(args: string[], name: string): string {
  const value = getFlag(args, name);
  if (!value) {
    throw new Error(`Missing required flag: --${name}`);
  }
  return value;
}

async function cmdCreateSchool(args: string[]) {
  const slug = requireFlag(args, "slug").toLowerCase();
  const name = requireFlag(args, "name");
  const operator = requireFlag(args, "operator");

  await withClient(async (client) => {
    const existing = await client.query("select id from public.schools where slug = $1", [slug]);
    if (existing.rowCount && existing.rowCount > 0) {
      throw new Error(`A school with slug "${slug}" already exists.`);
    }

    const result = await client.query(
      "insert into public.schools (slug, name, status) values ($1, $2, 'active') returning id",
      [slug, name],
    );
    const schoolId = result.rows[0].id as string;

    await client.query(
      `insert into public.audit_events (school_id, action, target_type, target_id, reason, outcome, metadata)
       values ($1, 'cli.create_school', 'school', $1, $2, 'success', $3)`,
      [schoolId, `Operator CLI: ${operator}`, JSON.stringify({ operator, slug, name })],
    );

    console.log(`Created school "${name}" (slug: ${slug}, id: ${schoolId}).`);
  });
}

async function cmdCreateFirstAdmin(args: string[]) {
  const schoolSlug = requireFlag(args, "school-slug").toLowerCase();
  const firstName = requireFlag(args, "first-name");
  const lastName = requireFlag(args, "last-name");
  const operator = requireFlag(args, "operator");

  await withClient(async (client) => {
    const schoolRes = await client.query("select id from public.schools where slug = $1", [schoolSlug]);
    if (schoolRes.rowCount === 0) {
      throw new Error(`No school with slug "${schoolSlug}".`);
    }
    const schoolId = schoolRes.rows[0].id as string;

    const existingAdmins = await client.query(
      `select count(*)::int as n
       from public.role_assignments ra
       join public.roles r on r.id = ra.role_id
       join public.school_memberships m on m.id = ra.membership_id
       where m.school_id = $1 and m.status = 'active' and ra.revoked_at is null
         and r.code in ('school_admin', 'principal')`,
      [schoolId],
    );
    if (existingAdmins.rows[0].n > 0) {
      throw new Error(
        `School "${schoolSlug}" already has an active admin/principal — use assign-principal or the app's own role management instead of creating a second "first" admin.`,
      );
    }

    const technicalEmail = `u-${randomBytes(16).toString("hex")}@accounts.campus.internal`;
    const password = randomPassword();

    const userId = await adminCreateAuthUser({
      email: technicalEmail,
      password,
      schoolId,
      firstName,
      lastName,
    });

    await client.query(
      `insert into public.school_memberships (school_id, user_id, status, joined_at)
       values ($1, $2, 'active', now())`,
      [schoolId, userId],
    );

    const usernameRes = await client.query(
      "select internal.fn_suggest_username($1, $2, $3) as username",
      [schoolId, firstName, lastName],
    );
    const username = usernameRes.rows[0].username as string;

    await client.query(
      `insert into internal.login_identifiers (profile_id, school_id, username_normalized, technical_email)
       values ($1, $2, $3, $4)`,
      [userId, schoolId, username, technicalEmail],
    );

    const roleRes = await client.query("select id from public.roles where code = 'school_admin'");
    await client.query(
      `insert into public.role_assignments (school_id, membership_id, role_id)
       select $1, m.id, $2 from public.school_memberships m where m.user_id = $3 and m.school_id = $1`,
      [schoolId, roleRes.rows[0].id, userId],
    );

    await client.query(
      `insert into public.audit_events (school_id, action, target_type, target_id, reason, outcome, metadata)
       values ($1, 'cli.create_first_admin', 'profile', $2, $3, 'success', $4)`,
      [schoolId, userId, `Operator CLI: ${operator}`, JSON.stringify({ operator, username })],
    );

    console.log(`Created first school_admin for "${schoolSlug}".`);
    console.log(`  Username: ${username}`);
    console.log(`  Initial password: ${password}`);
    console.log("  (Shown once — relay to the admin out-of-band, then discard.)");
  });
}

async function setPrincipalRole(args: string[], grant: boolean) {
  const schoolSlug = requireFlag(args, "school-slug").toLowerCase();
  const profileId = requireFlag(args, "profile-id");
  const reason = requireFlag(args, "reason");
  const operator = requireFlag(args, "operator");

  await withClient(async (client) => {
    const schoolRes = await client.query("select id from public.schools where slug = $1", [schoolSlug]);
    if (schoolRes.rowCount === 0) throw new Error(`No school with slug "${schoolSlug}".`);
    const schoolId = schoolRes.rows[0].id as string;

    const membershipRes = await client.query(
      "select id from public.school_memberships where user_id = $1 and school_id = $2",
      [profileId, schoolId],
    );
    if (membershipRes.rowCount === 0) {
      throw new Error(`Profile ${profileId} is not a member of "${schoolSlug}".`);
    }
    const membershipId = membershipRes.rows[0].id as string;

    const roleRes = await client.query("select id from public.roles where code = 'principal'");
    const principalRoleId = roleRes.rows[0].id as string;

    if (grant) {
      const activeRes = await client.query(
        `select id from public.role_assignments
         where membership_id = $1 and role_id = $2 and revoked_at is null`,
        [membershipId, principalRoleId],
      );
      if (activeRes.rowCount && activeRes.rowCount > 0) {
        throw new Error("This profile already holds an active principal role assignment.");
      }
      await client.query(
        "insert into public.role_assignments (school_id, membership_id, role_id) values ($1, $2, $3)",
        [schoolId, membershipId, principalRoleId],
      );
    } else {
      // Mirrors fn_assert_active_admin_remains: a revoke must not leave
      // the school with zero active school_admin/principal.
      const remaining = await client.query(
        `select count(*)::int as n
         from public.role_assignments ra
         join public.roles r on r.id = ra.role_id
         join public.school_memberships m on m.id = ra.membership_id
         where m.school_id = $1 and m.status = 'active' and ra.revoked_at is null
           and r.code in ('school_admin', 'principal') and ra.membership_id <> $2`,
        [schoolId, membershipId],
      );
      if (remaining.rows[0].n === 0) {
        throw new Error(
          "Revoking this principal would leave the school with no active admin/principal — use emergency-restore-admin to add another one first.",
        );
      }
      const updateRes = await client.query(
        `update public.role_assignments set revoked_at = now()
         where membership_id = $1 and role_id = $2 and revoked_at is null`,
        [membershipId, principalRoleId],
      );
      if (updateRes.rowCount === 0) {
        throw new Error("No active principal role assignment found for this profile.");
      }
    }

    await client.query(
      `insert into public.audit_events (school_id, action, target_type, target_id, reason, outcome, metadata)
       values ($1, $2, 'role_assignment', $3, $4, 'success', $5)`,
      [
        schoolId,
        grant ? "cli.assign_principal" : "cli.revoke_principal",
        membershipId,
        reason,
        JSON.stringify({ operator }),
      ],
    );

    console.log(`${grant ? "Assigned" : "Revoked"} principal role for profile ${profileId} in "${schoolSlug}".`);
  });
}

async function cmdEmergencyRestoreAdmin(args: string[]) {
  const schoolSlug = requireFlag(args, "school-slug").toLowerCase();
  const profileId = requireFlag(args, "profile-id");
  const reason = requireFlag(args, "reason");
  const operator = requireFlag(args, "operator");

  await withClient(async (client) => {
    const schoolRes = await client.query("select id from public.schools where slug = $1", [schoolSlug]);
    if (schoolRes.rowCount === 0) throw new Error(`No school with slug "${schoolSlug}".`);
    const schoolId = schoolRes.rows[0].id as string;

    const activeAdmins = await client.query(
      `select count(*)::int as n
       from public.role_assignments ra
       join public.roles r on r.id = ra.role_id
       join public.school_memberships m on m.id = ra.membership_id
       where m.school_id = $1 and m.status = 'active' and ra.revoked_at is null
         and r.code in ('school_admin', 'principal')`,
      [schoolId],
    );
    if (activeAdmins.rows[0].n > 0) {
      throw new Error(
        `School "${schoolSlug}" still has an active admin/principal — this is a break-glass command for a genuine lockout, not a normal admin-appointment path (use the app or assign-principal instead).`,
      );
    }

    const membershipRes = await client.query(
      "select id, status from public.school_memberships where user_id = $1 and school_id = $2",
      [profileId, schoolId],
    );
    if (membershipRes.rowCount === 0) {
      throw new Error(`Profile ${profileId} is not a member of "${schoolSlug}".`);
    }
    const membershipId = membershipRes.rows[0].id as string;

    await client.query(
      "update public.school_memberships set status = 'active', suspended_at = null, ended_at = null where id = $1",
      [membershipId],
    );

    const roleRes = await client.query("select id from public.roles where code = 'school_admin'");
    await client.query(
      `insert into public.role_assignments (school_id, membership_id, role_id)
       select $1, $2, $3
       where not exists (
         select 1 from public.role_assignments where membership_id = $2 and role_id = $3 and revoked_at is null
       )`,
      [schoolId, membershipId, roleRes.rows[0].id],
    );

    await client.query(
      `insert into public.audit_events (school_id, action, target_type, target_id, reason, outcome, metadata)
       values ($1, 'cli.emergency_restore_admin', 'school_membership', $2, $3, 'success', $4)`,
      [schoolId, membershipId, reason, JSON.stringify({ operator })],
    );

    console.log(`Restored school_admin access for profile ${profileId} in "${schoolSlug}" (break-glass).`);
  });
}

async function cmdSchoolStatus(args: string[]) {
  const schoolSlug = requireFlag(args, "school-slug").toLowerCase();

  await withClient(async (client) => {
    const schoolRes = await client.query(
      "select id, name, status, created_at from public.schools where slug = $1",
      [schoolSlug],
    );
    if (schoolRes.rowCount === 0) throw new Error(`No school with slug "${schoolSlug}".`);
    const school = schoolRes.rows[0];

    const counts = await client.query(
      `select r.code, count(*)::int as n
       from public.role_assignments ra
       join public.roles r on r.id = ra.role_id
       join public.school_memberships m on m.id = ra.membership_id
       where m.school_id = $1 and m.status = 'active' and ra.revoked_at is null
       group by r.code
       order by r.code`,
      [school.id],
    );

    const totalMembers = await client.query(
      "select status, count(*)::int as n from public.school_memberships where school_id = $1 group by status",
      [school.id],
    );

    console.log(`School: ${school.name} (slug: ${schoolSlug}, status: ${school.status})`);
    console.log(`Created: ${school.created_at}`);
    console.log("Active role counts:");
    for (const row of counts.rows) {
      console.log(`  ${row.code}: ${row.n}`);
    }
    console.log("Membership status counts:");
    for (const row of totalMembers.rows) {
      console.log(`  ${row.status}: ${row.n}`);
    }
    const hasAdmin = counts.rows.some((r) => r.code === "school_admin" || r.code === "principal");
    if (!hasAdmin) {
      console.log("WARNING: no active school_admin/principal — this school is locked out.");
    }
  });
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "create-school":
      return cmdCreateSchool(args);
    case "create-first-admin":
      return cmdCreateFirstAdmin(args);
    case "assign-principal":
      return setPrincipalRole(args, true);
    case "revoke-principal":
      return setPrincipalRole(args, false);
    case "emergency-restore-admin":
      return cmdEmergencyRestoreAdmin(args);
    case "school-status":
      return cmdSchoolStatus(args);
    default:
      console.error(
        "Usage: npm run cli -- <create-school|create-first-admin|assign-principal|revoke-principal|emergency-restore-admin|school-status> [--flag value ...]",
      );
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
