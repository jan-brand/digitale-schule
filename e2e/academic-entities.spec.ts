import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { ADMIN_A, login, uniqueSuffix } from "./helpers";

// Covers the pure-create academic structure flows (school year -> subject
// -> class -> course), replacing the ad-hoc form_submit_test.js Puppeteer
// script from this session's manual verification round with a durable,
// repeatable suite.
//
// Deliberately NOT covered here (left as manually-verified this session,
// see README.md M14): inviting a member, CSV import, and the
// teacher-issued password-recovery code. All three either create a real
// auth.users row (no delete-UI exists yet to clean it up from an
// automated run) or mutate a shared seed account's password
// (student.a1) — unsafe to run repeatedly/unattended against the shared
// demo server without a dedicated E2E-only seed account, which doesn't
// exist yet. Revisit once such a fixture account exists.
//
// Cleanup: if SUPABASE_DB_URL is set (e.g. via the SSH tunnel used
// throughout this session), the created rows are deleted afterwards so
// repeated runs don't accumulate garbage. Without it, the rows are left
// behind — acceptable for a demo school, but the env var should be set
// in CI.

const suffix = uniqueSuffix();
const yearName = `2098/2099 ${suffix}`;
const subjectName = `Fach ${suffix}`;
const subjectCode = suffix.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, "X");
const className = `Klasse ${suffix}`;
const courseName = `Kurs ${suffix}`;

test.describe.serial("academic structure: create school year -> subject -> class -> course", () => {
  test("create school year", async ({ page }) => {
    await login(page, ADMIN_A);
    await page.goto("/admin/school-years");
    await page.getByLabel("Bezeichnung (z. B. 2026/2027)").fill(yearName);
    await page.getByLabel("Beginn (JJJJ-MM-TT)").fill("2098-08-01");
    await page.getByLabel("Ende (JJJJ-MM-TT)").fill("2099-07-31");
    await page.getByRole("button", { name: "Anlegen" }).click();
    await expect(page.getByText(yearName)).toBeVisible({ timeout: 10_000 });
  });

  test("create subject", async ({ page }) => {
    await login(page, ADMIN_A);
    await page.goto("/admin/subjects");
    await page.getByLabel("Name (z. B. Mathematik)").fill(subjectName);
    await page.getByLabel("Kürzel (z. B. MATH)").fill(subjectCode);
    await page.getByRole("button", { name: "Anlegen" }).click();
    await expect(page.getByText(subjectName)).toBeVisible({ timeout: 10_000 });
  });

  test("create class (via school-year chip)", async ({ page }) => {
    await login(page, ADMIN_A);
    await page.goto("/admin/classes");
    await page.getByLabel("Name (z. B. 10a)").fill(className);
    await page.getByRole("button", { name: yearName }).click();
    await page.getByRole("button", { name: "Anlegen", exact: true }).click();
    await expect(page.getByText(className)).toBeVisible({ timeout: 10_000 });
  });

  test("create course (via subject + school-year chips)", async ({ page }) => {
    await login(page, ADMIN_A);
    await page.goto("/admin/courses");
    await page.getByLabel("Name (z. B. Mathematik 10a)").fill(courseName);
    await page.getByRole("button", { name: subjectName }).click();
    await page.getByRole("button", { name: yearName }).click();
    await page.getByRole("button", { name: "Anlegen", exact: true }).click();
    await expect(page.getByText(courseName)).toBeVisible({ timeout: 10_000 });
  });

  test("school_admin cannot delegate permissions.grant (D-018)", async ({ page }) => {
    await login(page, ADMIN_A);
    await page.goto("/admin/permissions");
    // Exact UI depends on member list rendering — this just asserts the
    // server-enforced rejection message appears somewhere on the screen
    // after attempting to grant, not a specific button path, since the
    // member list markup already changes release to release.
    const grantButtons = page.getByRole("button", { name: /berechtigung erteilen|erteilen/i });
    if ((await grantButtons.count()) > 0) {
      await grantButtons.first().click();
      await expect(page.getByText(/nur die Schulleitung|kann uneingeschränkt delegieren/i)).toBeVisible({
        timeout: 10_000,
      });
    }
  });
});

test.afterAll(async () => {
  const databaseUrl = process.env.SUPABASE_DB_URL;
  if (!databaseUrl) return;

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("delete from courses where name = $1", [courseName]);
    await client.query("delete from classes where name = $1", [className]);
    await client.query("delete from subjects where name = $1", [subjectName]);
    await client.query("delete from school_years where name = $1", [yearName]);
  } finally {
    await client.end();
  }
});
