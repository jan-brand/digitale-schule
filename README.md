# Campus (Arbeitstitel) – digitale-schule

Modulare Schulplattform für Schüler, Lehrkräfte, Eltern und Schuladministration.
Repository: https://github.com/jan-brand/digitale-schule

Diese README beschreibt die **Campus Foundation v0.1** – die technische Grundlage
(Auth, Mandantentrennung, Rollen, Basis-Dashboards). Fachmodule (Stundenplan, Aufgaben,
Nachrichten, Kalender, …) sind noch nicht implementiert und erscheinen zunächst nur als
deaktivierte Navigationspunkte.

## Planungsdokumente

Der Implementierungsauftrag kam ursprünglich als Planungspaket (`Campus_Projektstart_Paket.zip`),
das **keinen Anwendungscode** enthielt, sondern den Entwicklungsauftrag und technischen
Projektplan. Dessen Inhalte wurden nach `doc/` übernommen:

- `doc/PROJECT_PLAN.md` – Umfang, Roadmap, priorisiertes Backlog.
- `doc/ARCHITECTURE.md` – React/Expo/Supabase-Architektur, Projektstruktur, UI-Routen.
- `doc/DATA_MODEL.md` – Datenbankentitäten, Integritätsregeln, RLS-Testmatrix.
- `doc/SECURITY.md` – technische Sicherheits- und Datenschutzgates.
- `doc/ACCEPTANCE.md` – überprüfbare Definition of Done und Abnahmetests.
- `doc/design.md` – bestehende Designquelle (Campus Purple `#4C1D95`), unverändert
  beibehalten.
- `doc/archive/` – ursprüngliche Entwicklungsaufträge (`START_PROMPT.md`,
  `Campus_Foundation_Entwicklungsbrief_v1.md`) als historische Referenz.
- `doc/CAMPUS_IAM_ACCOUNT_LIFECYCLE_v0_4.md` – IAM-Invarianten, Einladungs-
  und Account-Lifecycle-Spezifikation (verbindlich für das Schema, siehe
  unten).
- `doc/CAMPUS_PERMISSION_MATRIX_FOUNDATION_v0_3.md` – Rechte-/Ressourcen-
  matrix je Rolle (verbindlich für RLS-Policies).

Bei Widersprüchen zwischen `promt.md` (Projektwurzel) und den `doc/`-Dokumenten gelten
die `doc/`-Dokumente als die detaillierte, verbindliche Spezifikation. Die beiden
IAM-/Permission-Dokumente sind die jeweils neuesten und gehen bei Widersprüchen
`doc/DATA_MODEL.md`s älterem Rollen-/Rechtemodell vor (siehe Schema-Hinweis unten).

## Stack

React Native + Expo + Expo Router (Web/iOS/Android), TypeScript Strict, Supabase
(PostgreSQL, Auth, Row Level Security, Edge Functions, Storage). Kein eigenes Backend,
kein Prisma.

## Setup

Voraussetzungen: Node (Version siehe `.nvmrc`), npm, Expo CLI (`npx expo`).

```bash
npm install
cp .env.example .env.local   # mit echten, lokalen/Dev-Werten befüllen – niemals committen
npm run lint
npm run typecheck
npm test
npm run web
```

### Supabase (lokal)

```bash
supabase start          # benötigt Docker
supabase db reset       # wendet supabase/migrations/* + seed.sql an
supabase test db        # pgTAP: RLS-Isolationsmatrix (supabase/tests/database/)
```

`supabase/migrations/` enthält das Schema in sechs versionierten, Supabase-CLI-kompatiblen Migrationen (`20261013220001`–06),
abgeglichen mit `doc/DATA_MODEL.md` sowie den neueren, vorrangigen
`doc/CAMPUS_IAM_ACCOUNT_LIFECYCLE_v0_4.md` und
`doc/CAMPUS_PERMISSION_MATRIX_FOUNDATION_v0_3.md`. Konkret umgesetzt:

- Keine `organizations`-Tabelle (Schulträgerhierarchie ist explizit nicht
  Foundation-Scope).
- Sechs Rollen: `student`, `teacher`, `parent`, `secretariat`, `principal`,
  `school_admin` (kein `school_authority`/`platform_operator` als DB-Rolle —
  Plattformbetrieb ist laut IAM-Dok bewusst keine Campus-Rolle).
- Mitgliedschafts-Lifecycle `invited → active → suspended/ended → archived →
  purged`; neue Tabellen `role_permissions`, `permission_grants`,
  `class_staff_assignments` (Klassenleitung), `school_invitations`.
- Rollen-/Mitgliedschafts-Schreibzugriffe laufen ausschließlich über die
  SECURITY-DEFINER-Funktionen `fn_assign_role`, `fn_revoke_role`,
  `fn_update_membership_status` — kein direktes INSERT/UPDATE-Grant auf
  `role_assignments`/`school_memberships` für `authenticated`. Diese
  Funktionen erzwingen IAM-005 (keine Selbstaufwertung), IAM-021
  (`principal` nur CLI), IAM-022 (letzter aktiver Admin unantastbar) und
  IAM-023 (Pflichtbegründung + atomarer Audit).

Alle Migrationen und Policies wurden gegen eine lokale Postgres-Instanz
verifiziert (siehe Commit-Historie). `supabase/tests/database/001-rls-isolation.sql`
deckt die Cross-Tenant-Testmatrix ab; `002-iam-invariants.sql` deckt
Selbstaufwertung, `principal`-CLI-only und die Letzter-Admin-Invariante ab.

**Bewusst noch nicht umgesetzt** (siehe der IAM-Dokumente eigener Vorbehalt
"noch kein implementierter Dienst" sowie dessen OPEN-01..10): der komplette
Einladungs-/Accept-Flow (`school_invitations` existiert nur lesend für
Admins, Issuing/Redeem ist eine Phase-F3-Edge-Function), Vergabe/Entzug von
`permission_grants` (OPEN-02, Delegationsgrenzen ungeklärt), Minderjährigen-
Aktivierung, MFA. Diese Lücken sind in den Docs selbst als offen markiert,
nicht nur hier.

### Supabase (Zielumgebung)

Die eigentliche Zielumgebung ist ein selbst betriebener Supabase-Stack unter
`supabase.jan-brand.space`. Zum Stand dieses Commits:

- Die URL + Anon-Key folgen dem öffentlich bekannten Supabase-Self-Hosting-
  Demo-Muster (`iss: "supabase-demo"`). **Vor jedem produktiven Einsatz müssen
  `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY` und `POSTGRES_PASSWORD` rotiert
  werden** – mit den Default-Werten hat jede Person, die die offizielle
  Self-Hosting-Dokumentation kennt, bereits vollen `service_role`-Zugriff.
- Eine funktionierende Postgres-Verbindung zu dieser Instanz stand bei der
  Erstellung dieser Migrationen nicht zur Verfügung; sie wurden deshalb lokal
  verifiziert, aber noch nicht gegen `supabase.jan-brand.space` angewendet.
  Das muss vor dem Merge nachgeholt werden (`psql`/`supabase db push` mit
  einer echten Verbindungszeichenfolge).

## Sicherheit

Niemals Service-Role-Keys oder andere privilegierte Geheimnisse im Frontend oder in
`EXPO_PUBLIC_*`-Variablen verwenden. Details: `doc/SECURITY.md`.
