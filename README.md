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

## Anwendung

1. Entpacken; Claude Code den Inhalt von `CLAUDE_CODE_UI_UX_RUNDE_11.md` als Prompt geben.
2. Die vier Dateien aus `doc/` als **Referenzdateien** bereitstellen. Nicht blind in einen bestehenden Branch kopieren; der Prompt verlangt einen Abgleich mit dem tatsächlich aktuellen Repository.
3. Merge-Diff prüfen, dokumentierte Widersprüche auflösen, danach gegebenenfalls PR für Dokumentation.

## Wichtige Auslegung

- **11.3 B:** Keine frei wählbare Widget-Bibliothek in Foundation.
- **11.11 A:** Bereits automatisch bereitgestellte Widgets weiterhin sortier-/ausblendbar, geeignete Größen änderbar und zurücksetzbar.
- **11.10 B:** Rollenansicht ändert nur Dashboard-Schwerpunkt, **niemals** die Rechte.
- **Runde 12:** Nur vorbereitet, **nicht beschlossen**.

**Gates:** Echte Auth-/IAM-/RLS-gebundene Features bleiben bis zum nachgewiesenen Abschluss entsprechender technischer Gates blockiert.
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
- **M2 (Auth-PoC): bestanden.** Username+Passwort-Login ohne Pflicht-E-Mail
  über echtes Supabase Auth live gegen die reale Instanz verifiziert
  (GoTrue v2.197.0, synthetische Testkonten, wieder gelöscht) — Details
  und die vollständige POC-01..10-Auswertung in `doc/ACCEPTANCE.md`
  Gate 1. Muster: synthetische "technische" E-Mail
  (`u-<uuid>@accounts.campus.internal`) als `auth.users.email`,
  serverseitig aus `(schoolSlug, username)` aufgelöst über die private
  `internal.login_identifiers`-Tabelle (`supabase/migrations/
  20261014150001_auth_poc_foundations.sql` — nicht über die Data API
  erreichbar), tatsächliche Passwortprüfung bleibt vollständig bei
  Supabase Auth.
  - Client-seitig umgesetzt: `src/providers/AuthProvider.tsx`, echter
    Login-Screen (`src/app/(auth)/login.tsx`), Routen-Guard in
    `src/app/_layout.tsx`, Logout in den Einstellungen.
  - Edge Functions `supabase/functions/auth-login` und
    `auth-provision-user` geschrieben; die zugrunde liegenden HTTP-Aufrufe
    wurden einzeln live gegen die echte Instanz verifiziert, aber **nicht**
    als paketiertes Edge-Function-Deployment ausgeführt (keine
    Deno-Edge-Runtime vor Ort deploybar in dieser Sitzung).
  - Noch offen aus dem PoC-Katalog: POC-05 (getrennte verifizierte
    Kontakt-E-Mail — Architektur geklärt, nicht gebaut), POC-06/07
    (Lehrkraft-Reset-Workflow — Kernmechanik von Supabase Auth bestätigt,
    UI/Tabelle fehlt noch), POC-09 (kein tatsächlicher Browser-/
    Simulator-Durchlauf in dieser Sitzung). Alle drei sind M5-Arbeit bzw.
    Umgebungs-Limitationen, kein Hinweis auf einen PoC-Fehlschlag.
- **M3 (finales Datenmodell): abgeschlossen.** Gegen die echte Instanz
  angewendet (`supabase/migrations/20261014180001_final_data_model.sql`,
  inkrementell, Backup zuerst, kein `db reset`):
  - `profiles` um `school_id`/`first_name`/`last_name`/`status` ergänzt,
    `display_name` entfernt; Backfill aus den bestehenden
    `school_memberships` bzw. dem alten `display_name` verifiziert.
  - Echte `permissions`-Katalogtabelle ersetzt den direkten
    `permission_key`-Enum-Vergleich in `role_permissions`/
    `permission_grants` (Enum bleibt als fester Werteraum erhalten,
    liefert aber nur noch `permissions.code`).
  - `role_assignments.role_code` → `role_id` (FK auf `roles`); alle
    SECURITY-DEFINER-Funktionen (`fn_assign_role`, `fn_revoke_role`,
    `fn_update_membership_status`, `fn_has_role`,
    `fn_assert_active_admin_remains`) umgehängt — Selbstaufwertungs-,
    Principal-CLI-only- und Letzter-Admin-Schutz unverändert bestätigt.
  - `school_invitations` → `invitations` (Doc hat Namensvorrang).
  - Neu (nur Schema, Workflows folgen in M5): `password_reset_requests`,
    `import_jobs`, `import_job_rows` — RLS aktiv, kein Client-Schreibrecht.
  - `user_preferences`: `(user_id, school_id)` → `profile_id` allein als PK.
  - **Beim Vorbereiten entdeckt:** ein 8. Profil (`max.vernon@icloud.com`,
    keine `school_memberships`-Zeile) existierte auf dem echten Server —
    kein Teil der synthetischen Seed-Daten. Nach Rückfrage als
    Alt-Testkonto bestätigt und vor der Migration über die Auth-Admin-API
    gelöscht (nicht per rohem SQL-Delete, damit GoTrue alle zugehörigen
    Zustände korrekt aufräumt).
  - `internal.login_identifiers` auch für die 7 bestehenden Seed-Accounts
    nachgetragen (vorher nur für neu über `auth-provision-user`
    angelegte Accounts vorhanden).
  - Alle 4 Testdateien (`001`–`004`) von Hand gegen Wegwerf-Postgres
    **und** identisch gegen die echte Instanz verifiziert.
- **Konformitätsnachtrag** (`20261014200001_conformance_fixes.sql`): zwei
  im Vorab-Check für M4 gefundene, kleine Abweichungen von
  `doc/DATA_MODEL.md` behoben — `school_years.status` und
  `user_preferences.locale` fehlten; additiv, keine Backfill-Risiken.
- **M4 (Benutzerverwaltung): abgeschlossen** — `20261014210001_m4_user_
  management.sql` + `supabase/functions/admin-invite-user`:
  - `internal.fn_suggest_username`: deterministischer, pro Schule
    eindeutiger Vorschlag aus Vor-/Nachname (Umlaute gefaltet,
    Kollisionen über numerischen Suffix aufgelöst); nicht direkt für
    `authenticated` freigegeben — nur intern von `fn_finalize_invite`
    genutzt, damit `internal.login_identifiers` wirklich nie client-seitig
    abfragbar wird, auch nicht indirekt.
  - `fn_finalize_invite`: legt Mitgliedschaft + Login-Identifier für ein
    bereits per Auth-Admin-API angelegtes Konto an; prüft
    `memberships.invite`-Berechtigung selbst serverseitig. Rollenvergabe
    bleibt ein separater `fn_assign_role`-Aufruf (unverändert, inkl.
    Selbstaufwertungs-/Principal-CLI-only-Schutz).
  - `fn_set_username`: administrative Umbenennung, nur Schuladmin/
    Schulleitung, erneute Eindeutigkeitsprüfung, auditiert (D-010).
  - `fn_grant_permission`/`fn_revoke_permission`: einzig möglicher
    Schreibweg für `permission_grants`. Schulleitung darf aus dem
    Katalog delegieren, ohne das Recht selbst zu benötigen (D-018);
    Schuladmin braucht dafür zuvor selbst `permissions.grant`; keine
    Selbstvergabe.
  - `supabase/functions/admin-invite-user`: App-seitiger Einladungsweg
    (im Gegensatz zum CLI-/Service-Role-only `auth-provision-user`) —
    leitet den JWT der aufrufenden Person bei jedem RPC-Aufruf weiter,
    damit `fn_finalize_invite`/`fn_assign_role` ihre echte Autorisierung
    gegen die tatsächlich anfragende Person prüfen; Service-Role-Key wird
    ausschließlich für den Admin-API-Aufruf zur Kontoerstellung selbst
    verwendet und nie an den Client zurückgegeben.
  - `src/features/identity/adminApi.ts` + minimaler, echter Admin-Screen
    (`src/app/(app)/admin/users.tsx`): Mitgliederliste, Einladen,
    Sperren/Reaktivieren. Noch ohne die späteren DataTable/Dialog-
    Komponenten (M8) — einfache, aber echte Listenansicht, keine
    Platzhalter.
  - Alle Autorisierungsregeln (kein Self-Grant, Schuladmin ohne Delegation
    abgelehnt, Schulleitung kann direkt delegieren, Student kann nicht
    einladen) sowohl gegen Wegwerf-Postgres als auch gegen die echte
    Instanz verifiziert (`supabase/tests/database/005-m4-user-management.sql`).
  - **Nicht live getestet:** das paketierte `admin-invite-user`
    Edge-Function-Deployment selbst (gleiche Einschränkung wie bei M2:
    kein Deno-Edge-Runtime-Deploy-Zugang hier) — die zugrunde liegenden
    Bausteine (Auth-Admin-API, `fn_finalize_invite`, `fn_assign_role`)
    wurden aber einzeln gegen die echte Instanz bestätigt.
- **Nächster Meilenstein (M5):** CSV-Import, Lehrkraft-initiierter
  Passwortreset-Workflow.

## Sicherheit

Niemals Service-Role-Keys oder andere privilegierte Geheimnisse im Frontend
oder in `EXPO_PUBLIC_*`-Variablen verwenden. Details: `doc/SECURITY_AUTH.md`.
