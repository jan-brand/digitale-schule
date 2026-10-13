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

Bei Widersprüchen zwischen `promt.md` (Projektwurzel) und den `doc/`-Dokumenten gelten
die `doc/`-Dokumente als die detaillierte, verbindliche Spezifikation.

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

`supabase/migrations/` enthält das vollständige Schema aus `doc/DATA_MODEL.md`
(Tabellen, Constraints, RLS-Policies) in sechs Schritten (`0001`–`0006`). Alle
Migrationen und die RLS-Policies wurden gegen eine lokale Postgres-Instanz
verifiziert (siehe Commit-Historie); `supabase/tests/database/001-rls-isolation.sql`
deckt die Kernfälle aus der Testmatrix ab (Cross-School-Zugriff verweigert,
Admin-Schreibzugriff korrekt auf die eigene Schule begrenzt, keine Grants für
`anon`).

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
