// Must match internal.login_identifiers.username_normalized exactly
// (citext — case-insensitive, but we still trim/lowercase client-side so
// validation messages and the Edge Function agree on what counts as
// empty/invalid before any network round-trip).
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalizeSchoolSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidLoginInput(schoolSlug: string, username: string, password: string): boolean {
  return normalizeSchoolSlug(schoolSlug).length > 0 && normalizeUsername(username).length > 0 && password.length > 0;
}
