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

Supabase-Migrationen liegen unter `supabase/migrations/`. Details zur Zielumgebung
(aktuell ein selbst betriebener Supabase-Stack) und Migrationskommandos folgen, sobald
die Schema-Migrationen vorliegen (siehe `doc/PROJECT_PLAN.md`, Phase F1).

## Sicherheit

Niemals Service-Role-Keys oder andere privilegierte Geheimnisse im Frontend oder in
`EXPO_PUBLIC_*`-Variablen verwenden. Details: `doc/SECURITY.md`.
