# Campus – Konkreter Implementierungs- und Lieferplan Foundation v0.1
Version 1.0 · Entwicklungsfreigabe für Vorarbeiten und PoC; Produktivfreigabe ausstehend.

## Ziel und Scope
Lauffähiges Expo-Web/Native-Grundsystem, Login per schulgebundenem Benutzername (nach PoC), Profile, schulgebundene Rollen, ausgewählte Schulorganisation, einfache echte Dashboards, sichere Einladungen/CSV, Admin-Basis, CLI-Schulbereitstellung, Tests und Staging. Keine Messenger-, Noten-, Klassenbuch-, Stundenplan-Generator-, Eltern-Kind-Vollprozesse.

## Repo-Vorgaben
Repo `jan-brand/digitale-schule`; vorhandene `doc/design.md`, Entwicklungsbrief und ZIP erhalten, ZIP zuerst prüfen. Bestehende veraltete `organizations`, gemeinsame Identity und globalen Schulwechsel in Doku korrigieren, **nicht ungeprüft löschen**. Änderungen nur Feature-Branch/PR. `doc/` beibehalten.

## Dateistruktur
```
src/app/{_layout.tsx,(auth)/login.tsx,(auth)/recover.tsx,(app)/dashboard.tsx,(app)/settings.tsx,(app)/admin/}
src/features/{auth,identity,school,iam,academic,invitations,imports,dashboard}/
src/providers/{AuthProvider,SchoolProvider,ThemeProvider}.tsx
src/components/{ui,navigation}/
src/lib/{supabase.ts,errors.ts}/
src/theme/{colors.ts,spacing.ts,typography.ts}/
src/types/database.types.ts
supabase/{config.toml,migrations/,functions/,tests/,seed.sql}
tools/campus-cli/
tests/{unit,integration,e2e}/
doc/{DECISIONS.md,ARCHITECTURE.md,DATA_MODEL.md,SECURITY_AUTH.md,IMPLEMENTATION_PLAN.md,ACCEPTANCE.md}
.env.example, .gitignore, package.json, package-lock.json, tsconfig.json, eslint.config.js, app.json, eas.json, README.md, .github/workflows/ci.yml
```

## Dependencies (SDK-kompatibel installieren)
Baseline: expo, react, react-native, expo-router, react-native-web, react-dom, typescript; @supabase/supabase-js, react-native-url-polyfill, expo-sqlite (Sessionadapter prüfen), react-native-safe-area-context, react-native-screens, expo-linking, expo-system-ui. Qualität: eslint, eslint-config-expo, vitest, @testing-library/react-native, playwright, supabase CLI, pgTAP/SQL-Tests. `npx expo install --check` nach Installation. Kein NestJS, Prisma, externes allgemeines Rollenframework für MVP.

## Priorisierte Arbeitsaufträge
| Ticket | Inhalt | Muss bestanden sein |
|---|---|---|
| P0-01 | Repository, ZIP und Doku abgleichen; Expo Bootstrap/strict TS/Web+native Starts, Design-Tokens | Start, Typcheck, Web-Export, Dokumentation |
| P0-02 | Local Supabase CLI, isoliertes Staging, Seeds mit Schule A/B; RLS-Testgerüst | `supabase db reset`, Tests laufen |
| P0-03 | **Auth PoC**, username ohne Pflicht-E-Mail, Supabase Session, Re-login, verifizierte Kontakt-E-Mail und Recovery | POC-01 bis POC-10, technische Entscheidung dokumentiert |
| P0-04 | Schema/Migrationen mit 1:1 Auth->School, composite FK, Permissions | DB-Constraints und Negativtests |
| P0-05 | RLS/Grants, geschützte Operations, Audit, last-admin concurrency | Security-Gate bestanden |
| P0-06 | CLI School Provision/Operator Recovery mit Audit, Setup/Deprovision Lifecycle | Schule A/B isoliert provisionierbar |
| P0-07 | Login/Logout/Session/School-Subdomain, geschützte Routes, Theme | Web/natives Auth-Smoke |
| P0-08 | User Invite/Activation, CSV Preview/Validation/Import, Reset-Lehrkräfte | keine Duplicate/unauthorized writes |
| P0-09 | Schuljahre, Klassen, Fächer, Kurse, Klassenleitung; Admin-Screens | FK/RLS und Rollenprüfung |
| P0-10 | Dashboard mit echten Daten, Navigation und WCAG Checks | keine erfundenen Live-Daten |
| P0-11 | CI/E2E/Staging/Runbook/Restore-Konzept | Acceptance Checklist dokumentiert |
| P0-12 | Einstellungen (`src/app/(app)/settings.tsx`) auf Widget-Pattern wie Dashboard umstellen, Pflicht-Widgets Konto/Sicherheit bleiben nicht ausblendbar, Darstellung optional personalisierbar — Konzept: `doc/SETTINGS_WIDGETS_PLAN.md` | Keine neuen RLS-/Auth-Pfade; bestehende Gate-3-Prüfung (Profile nutzbar, WCAG) nach Umsetzung wiederholt |

## Vorgeschlagene PR-Grenzen
PR-01 Doku/Expo/CI; PR-02 Supabase test infrastructure + Auth PoC (BLOCKER); PR-03 Schema/RLS/privileged functions; PR-04 CLI/Invite/CSV/Reset; PR-05 UI/Admin/Dashboard; PR-06 Security/Staging/Acceptance. Keine Arbeit an endgültiger Username-Login-Implementierung bevor PoC besteht.

## API-Fachverträge
`auth.signIn({schoolSlug,username,password})`, `auth.signOut()`, `auth.recover({schoolSlug,method})`, `profiles.getMe()`, `school.getCurrent()`, `admin.inviteUser()`, `admin.importCsv()`, `admin.assignRole({reason})`, `admin.assignClassLead()`, `admin.resetStudentPassword()`, `academic.list*()`, `preferences.update()`. Alle mit typisierten Fehlern, autorisiert und auditierbar; keine direkte privilegierte Tabellenmutation vom Client.

## Entwicklungsregeln
- TypeScript strict, ESLint, formatierte Migrationsnamen, versioniertes Lockfile; Tests und Code Review PR-pflichtig.
- Jeder PR: Zweck, Schemaänderungen, Migration/Revert-Plan, ausgeführte/nicht ausgeführte Tests, Security-Auswirkung, Screenshots falls UI, offene Risiken.
- Testpersonen nur fiktiv; keine echten Schuldaten vor Rechts-/Sicherheitsfreigabe.
- Null-Secrets im Bundle, kein tatsächlicher `service_role`/secret Key in Repo.
- Web-First UX, mobile Startbarkeit bei jedem Release; Light/Dark, WCAG 2.2 AA Ziel.

## Definition of Done
Keine offenen P0-Sicherheitsfehler, Tests grün, zwei Schulen hart getrennt, Rollen und Reset nach Regeln, E-Mail nur verifiziert, Admin-Aktionen auditiert, Browser-Domainkontext geprüft, lokales Setup und Staging reproduzierbar. Produktive Inbetriebnahme nur nach gesondertem Betriebs-/Datenschutz-Gate.
