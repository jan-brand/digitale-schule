import { Slot, usePathname } from "expo-router";
import { AppShell } from "@/components/layout/AppShell";
import { useCurrentMember } from "@/features/identity/useCurrentMember";

const TITLES: Record<string, string> = {
  "/dashboard": "Übersicht",
  "/school": "Schule",
  "/settings": "Profil & Einstellungen",
  "/admin/users": "Mitglieder",
  "/admin/import": "CSV-Import",
  "/admin/school-years": "Schuljahre",
  "/admin/classes": "Klassen",
  "/admin/subjects": "Fächer",
  "/admin/courses": "Kurse",
  "/admin/permissions": "Berechtigungen",
  "/admin/modules": "Module",
  "/admin/audit": "Audit",
};

// Wraps every authenticated screen with the adaptive shell (doc/UI_UX_
// SPECIFICATION.md §4). hasAdminAccess from useCurrentMember is UX-only
// (which nav items are offered) — it is not and never replaces the
// server-side RLS/role checks each admin screen's own data calls
// already enforce independently.
export default function AppLayout() {
  const pathname = usePathname();
  const { member } = useCurrentMember();
  const title = TITLES[pathname] ?? "Campus";

  return (
    <AppShell title={title} hasAdminAccess={member?.hasAdminAccess ?? false}>
      <Slot />
    </AppShell>
  );
}
