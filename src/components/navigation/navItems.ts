// Global navigation per doc/UI_UX_SPECIFICATION.md §3: Übersicht/Schule/
// Verwaltung(conditional)/Settings, unified across roles — the server
// independently re-authorizes every target regardless of what's shown
// here (UX is not the security boundary).
export interface NavItem {
  key: string;
  label: string;
  href: string;
}

export const ALWAYS_VISIBLE_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Übersicht", href: "/(app)/dashboard" },
  { key: "school", label: "Schule", href: "/(app)/school" },
];

export const SETTINGS_ITEM: NavItem = { key: "settings", label: "Profil & Einstellungen", href: "/(app)/settings" };

export const ADMIN_ITEMS: NavItem[] = [
  { key: "admin-users", label: "Mitglieder", href: "/(app)/admin/users" },
  { key: "admin-import", label: "CSV-Import", href: "/(app)/admin/import" },
  { key: "admin-school-years", label: "Schuljahre", href: "/(app)/admin/school-years" },
  { key: "admin-classes", label: "Klassen", href: "/(app)/admin/classes" },
  { key: "admin-permissions", label: "Berechtigungen", href: "/(app)/admin/permissions" },
];

export function buildNavItems(hasAdminAccess: boolean): NavItem[] {
  return [...ALWAYS_VISIBLE_ITEMS, ...(hasAdminAccess ? ADMIN_ITEMS : []), SETTINGS_ITEM];
}
