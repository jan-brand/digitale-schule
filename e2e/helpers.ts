import { Page } from "@playwright/test";

// Seed credentials established this session (see README.md M2/M13):
// admin.a@campus.test in school "demo-a", password reset once by hand
// since the original seed password was never recorded.
export const ADMIN_A = { schoolSlug: "demo-a", username: "admin.a", password: "CampusVerify#2026" };

export async function login(page: Page, creds: { schoolSlug: string; username: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Schule").fill(creds.schoolSlug);
  await page.getByLabel("Benutzername").fill(creds.username);
  await page.getByLabel("Passwort", { exact: true }).fill(creds.password);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
}

export function uniqueSuffix(): string {
  return `E2E-${Date.now()}`;
}
