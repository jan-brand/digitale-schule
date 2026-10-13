# Campus (Arbeitstitel) – digitale-schule

Schulplattform (SaaS), ein Campus = eine Schule. Repository:
https://github.com/jan-brand/digitale-schule

Diese README beschreibt den aktuellen Stand von **Campus Foundation v0.1**.
Fachmodule (Stundenplan, Aufgaben, Nachrichten, Kalender, Noten, …) sind
nicht Teil von Foundation und erscheinen höchstens als deaktivierte
Navigationspunkte – siehe `doc/DECISIONS.md` (D-023).

## Verbindliche Dokumente (in dieser Reihenfolge lesen)

Siehe `START_HERE.md`. Diese Dokumente in `doc/` sind der aktuelle,
verbindliche Stand und ersetzen widersprüchliche **Planungsannahmen** in
älteren Dateien (Code bleibt davon unberührt, bis er entsprechend
angepasst ist):

1. `doc/DECISIONS.md` – Entscheidungsregister (D-001..D-024), verdrängte
   ältere Annahmen, offene technische Freigaben (GATE-AUTH, GATE-HOST,
   GATE-LEGAL).
2. `doc/ARCHITECTURE.md` – Systemgrenzen, Mandantenkontext, ADRs.
3. `doc/SECURITY_AUTH.md` – Auth, Rechte, Recovery, Sicherheitstest-Katalog.
4. `doc/DATA_MODEL.md` – Entitäten/Constraints/Migrationsreihenfolge.
   **Noch nicht final** – siehe Hinweis unten.
5. `doc/IMPLEMENTATION_PLAN.md` – Dateistruktur, Tickets, PR-Grenzen, DoD.
6. `doc/ACCEPTANCE.md` – Gates 0–4 (Repo-Basis, Auth-PoC-Blocker,
   Mandantentrennung/IAM, Funktionale Foundation, Produktivfreigabe).

Ältere Dokumente (`doc/PROJECT_PLAN.md`, `doc/SECURITY.md`,
`doc/CAMPUS_IAM_ACCOUNT_LIFECYCLE_v0_4.md`,
`doc/CAMPUS_PERMISSION_MATRIX_FOUNDATION_v0_3.md`, `doc/archive/`) bleiben
erhalten, sind aber durch die Liste oben überholt, wo sie widersprechen –
insbesondere die frühere Annahme "ein Benutzer kann mehreren Schulen
angehören" ist durch D-004 ersetzt: **ein Account gehört zu genau einer
Schule.**

## Stack

React Native + Expo + Expo Router (Web/iOS/Android), React Native Web,
TypeScript Strict, Supabase (PostgreSQL, Auth, RLS, Edge Functions,
Storage). Kein NestJS, kein Prisma, kein eigenes Auth-/Passwortsystem.

## Projektstruktur

```
src/app/            Expo Router (root via app.json expo-router-Plugin-Option)
src/features/       fachliche Module (folgt ab M2/M3)
src/providers/       AuthProvider (folgt), ThemeProvider
src/components/{ui,navigation}/
src/lib/{supabase.ts,errors.ts}
src/theme/
src/types/database.types.ts
supabase/{config.toml,migrations/,functions/,tests/,seed.sql}
```

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

### Supabase (Zielumgebung)

Selbst betriebener, nativer Supabase-Stack (kein Docker) unter
`https://supabase.jan-brand.space` (öffentliche Studio-Adresse, hinter
HTTP-Basic-Auth – **kein** API-/DB-Endpunkt). Direkter Zugriff:

- PostgreSQL und die Supabase-API sind auf dem Server nur auf `127.0.0.1`
  erreichbar (Ports `54322`/`54321`/`54323`), nicht öffentlich.
- Erreichbar via SSH-Tunnel (Port-Forward auf `127.0.0.1:54322`); SSH-Key
  wurde für einen eigenen, unprivilegierten Benutzer hinterlegt.
- Migrationen wurden bereits einmal gegen diese Instanz angewendet (siehe
  Commit-Historie) – **werden aber nach dem Auth-PoC (Gate 1) neu
  aufgesetzt**, siehe nächster Abschnitt.

## Aktueller Stand und nächster Schritt

- **M1 (technische Basis):** erledigt – Expo/TS/Lint/CI/Theme (inkl. Accent-
  Token), Projektstruktur gemäß `doc/IMPLEMENTATION_PLAN.md`.
- **Sicherheits-Hotfix** (`supabase/migrations/20261014090001_security_
  hardening_and_tenant_fix.sql`, inkrementell auf die echte Instanz
  angewendet, kein `db reset`): behebt drei P0-Befunde aus dem Code-Review
  von Commit `79ebec4a8a97` —
  1. `fn_write_audit_event` war direkt für `authenticated` ausführbar und
     ohne eigene Autorisierungsprüfung; beliebige Audit-Einträge wären
     fälschbar gewesen. Direktes `EXECUTE`-Recht entzogen; bleibt intern
     für die privilegierten SECURITY-DEFINER-Funktionen nutzbar.
  2. `fn_revoke_role`/`fn_update_membership_status` verhinderten den Entzug
     der Schulleitungsrolle nur, wenn dadurch kein Admin mehr übrig bliebe
     — nicht grundsätzlich. Beide blockieren `principal` jetzt
     bedingungslos (direkt und über den indirekten Suspendierungs-Pfad);
     das bleibt ausschließlich der Betreiber-CLI vorbehalten.
  3. `school_memberships` erlaubte dieselbe Auth-Identität in zwei Schulen
     (`UNIQUE(school_id,user_id)`). Jetzt `UNIQUE(user_id)` — eine
     Identität gehört genau einer Schule (D-004).

  Alle drei Fixes wurden vor der Anwendung lokal (Wegwerf-Postgres) **und**
  danach identisch gegen die echte Instanz verifiziert; Negativtests dafür
  in `supabase/tests/database/003-security-hotfix.sql`. Vollständiger
  `pg_dump`-Backup vor der Anwendung gezogen (liegt nicht im Repo).

  **Noch nicht Teil dieses Hotfixes:** der vollständige Umbau von
  `profiles`/`login_identifiers` auf das finale, PoC-abhängige Schema
  (`doc/DATA_MODEL.md`) — das bleibt PR 3, nach dem Auth-PoC.
- **Nächster Meilenstein (M2):** Auth-Proof-of-Concept — Benutzername+
  Passwort-Login ohne Pflicht-E-Mail über Supabase Auth, siehe GATE-AUTH in
  `doc/DECISIONS.md` und POC-01..10 in `doc/ACCEPTANCE.md`. Blockiert die
  endgültige Login-Implementierung; andere Komponenten dürfen parallel
  weiterentwickelt werden.

## Sicherheit

Niemals Service-Role-Keys oder andere privilegierte Geheimnisse im Frontend
oder in `EXPO_PUBLIC_*`-Variablen verwenden. Details: `doc/SECURITY_AUTH.md`.
