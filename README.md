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
- **M5 (Teil 1, Passwort-Reset): abgeschlossen** —
  `20261014230001_m5_password_reset.sql` +
  `supabase/functions/{password-recovery-request,password-recovery-redeem}`
  + `supabase/functions/_shared/email.ts`:
  - **E-Mail-Weg geplant, in Entwicklung geloggt:** `EmailSender`-
    Abstraktion mit `EMAIL_PROVIDER=log` (Standard, schreibt Inhalt inkl.
    Code/Link in die Function-Logs) und einem noch nicht implementierten
    `smtp`-Pfad (wirft bewusst einen Fehler statt stillschweigend nichts
    zu tun, bis `SMTP_*`-Secrets existieren) — Plan für die echte
    SMTP-Anbindung (Env-Variablen, Deno-SMTP-Client, Log-Hygiene ohne
    Klartext-Inhalte) im Modul-Kommentar dokumentiert.
  - `profiles.contact_email`/`contact_email_verified_at` ergänzt (POC-05):
    getrennt von `auth.users.email`, damit eine spätere Verifizierung den
    technischen Login niemals zerstören kann.
  - Verfahren A (verifizierte E-Mail, `password-recovery-request`):
    öffentlich, kein Login nötig; liefert **immer** dieselbe generische
    Antwort, unabhängig davon, ob Konto/Schule/verifizierte E-Mail
    existieren (keine Enumeration).
  - Verfahren B (`fn_issue_teacher_reset_code`): einzig möglicher Weg,
    einen `teacher_code`-Eintrag anzulegen. Nur aktive Lehrkraft/Admin
    derselben Schule, Ziel muss Schülerrolle haben, vorherige nicht
    eingelöste Codes werden beim Ausstellen eines neuen automatisch
    entwertet, Code wird einmalig zurückgegeben (nie per E-Mail).
  - `password-recovery-redeem`: gemeinsame Einlösung für beide Verfahren;
    atomares `UPDATE ... RETURNING` verhindert Doppel-Einlösung; nutzt
    dieselbe Admin-API-Erkenntnis aus M2 (Passwortänderung entwertet
    alte Refresh-Tokens automatisch).
  - Echte UI: `(auth)/recover.tsx` (beide Verfahren), Button „Reset-Code“
    pro Schülerzeile in `/admin/users`.
  - **Beim Verifizieren gegen die echte Instanz gefunden:** `digest()`
    aus pgcrypto schlug dort fehl — `pgcrypto` liegt auf dem echten
    Server im Schema `extensions`, nicht `public` (anders als auf jeder
    Wegwerf-Postgres-Instanz in dieser Sitzung, wo es default nach
    `public` installiert wird). `fn_issue_teacher_reset_code`s
    `search_path` fehlte `extensions`. Noch vor dem ersten Commit in der
    Migrationsdatei selbst korrigiert (nicht nachträglich "gefixt"), die
    bereits angewendete, fehlerhafte Version direkt auf dem echten
    Server durch die korrigierte ersetzt.
  - Alle 5 Testfälle (`006-m5-password-reset.sql`) gegen Wegwerf-Postgres
    **und** identisch gegen die echte Instanz verifiziert (letztere erst
    nach dem `search_path`-Fix erfolgreich). Postgres.js/Deno-Grundlagen
    (`sql.json()`, parametrisierte Inserts) separat gegen eine lokale
    Wegwerf-DB bestätigt — die paketierten Edge Functions selbst liefen
    nicht live (gleiche Umgebungsgrenze wie M2/M4).
- **M5 (Teil 2, CSV-Import): abgeschlossen** —
  `20261014240001_m5_csv_import.sql` + `supabase/functions/admin-import-
  csv-process` + `src/app/(app)/admin/import.tsx`:
  - Pipeline in vier Schritten: `fn_stage_csv_import` (reine SQL-Funktion,
    parst/validiert eine bereits client-seitig geparste Zeilen-Liste —
    kein Service-Role nötig), Admin sieht die Vorschau direkt über die
    bestehende admin-read-only-RLS auf `import_job_rows`,
    `fn_confirm_csv_import` (atomarer Claim, schützt gegen doppelte
    Ausführung — ein zweiter Bestätigungsversuch auf einen bereits
    laufenden Job schlägt fehl), dann die eigentliche Kontoanlage pro
    Zeile in der Edge Function (Admin-API + `fn_finalize_invite` +
    `fn_assign_role`, exakt wie beim Einzel-Invite aus M4).
  - Validierung pro Zeile: fehlender Name, nicht erlaubte Rolle
    (`school_admin`/`principal` sind im Bulk-Import nie erlaubt —
    Schulleitung bleibt CLI-only, Schuladmin-Ernennung bleibt ein
    einzeln begründeter `fn_assign_role`-Aufruf), unbekannte Klasse,
    Duplikat innerhalb derselben Datei.
  - **Bewusste Lücke:** Es gibt noch keine Tabelle, die einen Schüler
    einer Klasse zuordnet (`doc/DATA_MODEL.md`s Tabellenliste kennt nur
    `class_staff_assignments` für Klassenleitungen). Die Klassenspalte
    wird nur auf Existenz geprüft (referenzielle Integrität), aber nicht
    persistiert — das ist M10-Schulorganisations-Arbeit, sobald es eine
    solche Tabelle gibt.
  - **Datei wählen → Text einfügen:** Bewusst kein nativer Datei-Picker
    (`expo-document-picker`) ergänzt — keine neue native Abhängigkeit
    ohne Möglichkeit, sie hier an einem echten Gerät/Simulator zu
    verifizieren. Das Backend verarbeitet ohnehin nur bereits geparste
    Zeilen, ein echter Picker lässt sich später ohne Backend-Änderung
    nachrüsten.
  - **Beim Testen gefunden und vor dem ersten Commit korrigiert:** zwei
    `CASE`-Ausdrücke ohne expliziten Enum-Cast
    (`import_row_validation_state`) scheiterten beim Insert/Update —
    Postgres konnte den Text-Literal-Typ nicht automatisch ableiten.
  - `src/features/identity/csv.ts`: eigener minimaler CSV-Parser
    (Pflichtspalten `first_name,last_name,role_code`, optional
    `class_name`; behandelt doppelte Anführungszeichen korrekt) mit
    7 echten Unit-Tests — keine neue Abhängigkeit für reines Text-Parsen.
  - Alle 8 Testfälle (`007-m5-csv-import.sql`) gegen Wegwerf-Postgres
    **und** identisch gegen die echte Instanz verifiziert.
- **M6 (Campus-CLI): abgeschlossen** — `tools/campus-cli/` (eigenständiges
  Node-Skript, läuft über `npm run cli -- <befehl>`, **niemals** Teil des
  Expo-Bundles, siehe eigene `tools/campus-cli/README.md`):
  - Befehle: `create-school`, `create-first-admin` (Admin-API +
    `internal.fn_suggest_username` + direkte Rollenzuweisung — die CLI
    operiert mit privilegiertem direktem DB-Zugriff, nicht über
    `fn_assign_role`, da bei einer brandneuen Schule noch kein
    autorisierter „Aufrufer" existiert), `assign-principal`/
    `revoke-principal` (einzig möglicher Weg für die Schulleitungsrolle
    — `fn_assign_role`/`fn_revoke_role` in der App lehnen `principal`
    kategorisch ab), `emergency-restore-admin` (Break-Glass: verweigert
    die Ausführung, wenn die Schule noch einen aktiven Admin/
    Schulleitung hat — kein normaler Ernennungsweg), `school-status`.
  - Jeder privilegierte Befehl verlangt `--operator` + `--reason` und
    schreibt einen `audit_events`-Eintrag.
  - **Bewusst nicht gelöst** (`doc/DECISIONS.md` OPEN-10, unverändert
    offen): keine Operator-Authentifizierung, keine Vier-Augen-Kontrolle
    für Break-Glass-Aktionen. `--operator` ist Freitext zur
    Nachvollziehbarkeit, keine echte Identität — die eigentliche
    Berechtigungsgrenze ist aktuell, wer die DB-/Service-Role-Zugangsdaten
    besitzt (organisatorisch, nicht technisch durchgesetzt).
  - **Tatsächlich ausgeführt** (nicht nur die zugrunde liegende SQL wie
    bei den Edge Functions zuvor — dieses Tool läuft als normales
    Node-Skript, keine Deno-Edge-Runtime-Einschränkung): alle Befehle
    gegen Wegwerf-Postgres real durchlaufen, inklusive doppelter
    Slug-Ablehnung, Letzter-Admin-Schutz bei `revoke-principal`, Break-
    Glass-Verweigerung bei vorhandenem Admin und erfolgreicher
    Wiederherstellung bei echtem Lockout, Audit-Einträge geprüft.
    `school-status` zusätzlich lesend gegen die echte Instanz bestätigt.
    `create-first-admin`s Admin-API-Aufruf wurde nicht live gegen die
    echte Instanz ausgeführt (reale Kontoanlage), seine Logik danach
    entspricht exakt dem bereits verifizierten `auth-provision-user`-
    Muster.
- **M7 (App Shell und Navigation): abgeschlossen** —
  `src/components/layout/{AppShell,Sidebar,BottomNavigation,TopBar}.tsx`,
  `src/components/navigation/navItems.ts`,
  `src/features/identity/useCurrentMember.ts`, `src/app/(app)/_layout.tsx`,
  neuer Screen `(app)/school.tsx` (SCR-05), nach `doc/UI_UX_
  SPECIFICATION.md` (UX-02-Ticket):
  - Adaptive Shell: < 768 px → Bottom Navigation (Übersicht/Schule/Mehr)
    mit „Mehr“ als Sheet (natives `Modal`, keine neue Abhängigkeit);
    ≥ 768 px → einklappbare Seitenleiste (Zustand lokal persistiert,
    wie schon beim Theme). TopBar mit Seitentitel + Suchfeld, klar als
    „noch nicht verfügbar" markiert (§16.1 erlaubt das explizit, solange
    nicht als funktionierendes Feature simuliert — echte
    rollenübergreifende Suche ist ein eigenes, hier nicht enthaltenes
    Ticket).
  - `useCurrentMember`: eine Abfrage der eigenen Mitgliedschaft (RLS
    „eigene Zeile" — kein Sonderfall nötig, D-004 garantiert ohnehin nur
    eine Schule) liefert Rollen für die Navigationsanzeige. Rein
    UX-seitig: „Verwaltung" erscheint nur bei `school_admin`/`principal`,
    aber jede Admin-Route prüft ihre Berechtigung weiterhin unabhängig
    serverseitig.
  - **Bewusste Vereinfachung:** Die Spezifikation unterscheidet drei
    Breakpoints (Mobil/Tablet/Desktop), hier nur zwei umgesetzt — Tablet
    bekommt dieselbe Sidebar wie Desktop statt einer eigenen temporären
    Overlay-Variante. Zeitlich begründete Vereinfachung, keine
    übersehene Anforderung.
  - Barrierefreiheit: eingeklappte Sidebar-Einträge behalten ihren
    vollen Accessibility-Namen (nicht nur den sichtbar verkürzten
    Anfangsbuchstaben) — beim Umsetzen explizit nachgezogen, da zunächst
    übersehen.
  - **Nicht visuell im Browser verifiziert** (kein Browser-Tool in
    dieser Sitzung verfügbar) — nur `typecheck`/`lint`/`test`/
    `web:build` (jetzt mit `/school`) bestanden.
- **M8 (Foundation-UI-Komponenten): abgeschlossen** — neue
  `src/components/ui/{LoadingState,EmptyState,ErrorState,Badge,Dialog,
  ConfirmDialog,ThemeToggle,PermissionGate,PasswordField,
  DashboardWidget,WidgetEditControls}.tsx` und
  `src/components/layout/ResponsiveDataList.tsx`, plus ein echter
  `danger`-Button-Variant (vorher gab es nur primary/secondary).
  - Nicht nur Katalog — direkt in bestehende Screens zurückgezogen:
    `admin/users.tsx` nutzt jetzt `ResponsiveDataList` (Tabelle ab
    768px, Kartenliste darunter) + `ConfirmDialog` mit Pflichtbegründung
    für Sperren/Reaktivieren/Reset-Code (vorher ohne jede Bestätigung
    ausgeführt — echte Lücke, beim Umbau behoben, nicht nur
    kosmetisch); `settings.tsx` nutzt `ThemeToggle`; `login.tsx`/
    `recover.tsx` nutzen `PasswordField` (SCR-01 fordert explizit
    „Anzeigen/Verbergen", vorher fehlte das).
  - `ConfirmDialog`/`Dialog` sind reine UI — sie ersetzen nicht die
    serverseitige Pflichtbegründung, die jede betroffene SECURITY
    DEFINER-Funktion bereits unabhängig durchsetzt.
  - Bewusst nicht gebaut (kein aktueller Bedarf): `Select`, `Checkbox`,
    `IconButton`, `Toast`, `Breadcrumbs` — Katalog wird bei Bedarf
    erweitert statt vorab vollständig durchgebaut.
- **M9 (Dashboard und Personalisierung): abgeschlossen** —
  `src/app/(app)/dashboard.tsx`, `src/components/dashboard/widgets/
  {MyCampusWidget,MyAccountWidget,MyAssignmentsWidget,
  AdministrationWidget,ModulesWidget,SecurityNoticeWidget}.tsx`,
  `src/features/dashboard/useMyAssignments.ts`, nach `doc/UI_UX_
  SPECIFICATION.md` §6 (Runde 11):
  - W-01–W-06 wie spezifiziert: W-01 „Mein Campus" fest oben, nicht
    personalisierbar; W-02 „Mein Konto"; W-03 „Meine Zuordnungen" aus
    echten `course_memberships`- und aktiven
    `class_staff_assignments`-Zeilen (RLS-beschränkt auf eigene
    `user_id`/`membership_id`) — **kein** erfundener Stundenplan, keine
    Noten (§6.7 verbietet das); W-04 „Verwaltung" nur bei
    `hasAdminAccess`, mit echter Mitgliederzahl (RLS-gezählt) statt
    Platzhalter; W-05 „Module" nur echte, funktionierende Routen; W-06
    „Sicherheitshinweis" nur bei echtem Zustand (unverifizierte
    Kontakt-E-Mail — der einzige real vorhandene Signaltyp), nicht
    ausblendbar solange er gilt.
  - Personalisierung (§6.5): W-02/W-03/W-04/W-05 per
    `WidgetEditControls` verschiebbar/größenänderbar/ausblendbar,
    „Standard wiederherstellen" setzt eine aktuell zulässige
    Rollenvorlage zurück. **Nur lokal persistiert** (AsyncStorage,
    dasselbe Muster wie Theme/Sidebar) — nicht die vom Dokument
    letztlich gewünschte serverseitige Pro-Konto-Persistenz; bewusste
    Vereinfachung, nicht verschwiegen.
  - Bei Rollenverlust/Rechteentzug werden nicht mehr zulässige Widgets
    aus der gespeicherten Reihenfolge entfernt (`reconcile()`), nie aus
    einer veralteten lokalen Präferenz wiederhergestellt (§6.4).
  - Rollenansicht-Auswahl (§6.4) nur bei mehreren aktiven Rollen
    sichtbar, steuert nur Darstellungsschwerpunkt, keine Navigation/
    Rechte; **nicht persistiert** — laut Dokument selbst offene Frage
    12.8, hier bewusst nicht vorweggenommen.
  - Verifiziert: `typecheck`/`lint`/`test`/`web:build` bestehen; **nicht
    visuell im Browser geprüft** (kein Browser-Tool verfügbar) —
    insbesondere die Rollenfokus-Sortierung und das Ein-/Ausblenden
    wurden nicht interaktiv getestet.
- **M10 (Schulorganisation, Klassen-Roster, globale Suche):
  abgeschlossen** — neue Migration
  `supabase/migrations/20261014250001_m10_class_rosters.sql`:
  `class_memberships`-Tabelle (Schüler↔Klasse), RLS enger als
  `class_staff_assignments`/`classes` (nur eigene Zeile oder
  `school_admin`/`classes.manage`, nicht jedes aktive Mitglied —
  begründet in der Migration: eine volle Klassenliste ist
  sensibler als wer sie unterrichtet, SCR-08 „keine unnötigen
  privaten Daten"). `fn_confirm_csv_import` liefert jetzt zusätzlich
  `class_name` zurück (Signaturänderung, daher `DROP FUNCTION` +
  Neuanlage in der neuen Migration statt Edit der alten).
  - **Schließt die in M5 Teil 2 dokumentierte Lücke:** CSV-Import
    validierte `class_name` bereits, konnte ihn aber nirgends
    speichern, da die Tabelle fehlte. `admin-import-csv-process` löst
    jetzt pro Zeile die Klasse auf und legt den Roster-Eintrag an
    (über das eigene weitergeleitete JWT des Aufrufers, RLS-geprüft
    wie jeder andere Schreibzugriff in dieser Funktion). Fehlt dem
    Aufrufer `classes.manage` (nur `memberships.invite` genügt zum
    Importieren selbst), schlägt nur die Klassenzuordnung fehl — das
    Konto wird trotzdem angelegt; bewusst nicht als Zeilenfehler
    gewertet, da der eigentliche Import erfolgreich war.
  - Vollständige Verify-Disziplin eingehalten: Wegwerf-Postgres (lokal
    neu aufgesetzt, Stub-`auth`-Schema wie in früheren Milestones),
    alle 14 Migrationen + `seed.sql` angewendet, manuelle Replays von
    Test 007 (CSV-Import) und neue RLS-Checks für `class_memberships`
    (Admin sieht Klasse, eigene Zeile sichtbar, fremde Schülerzeile
    nicht sichtbar, cross-school verweigert, Lehrkraft ohne
    `classes.manage` kann nicht schreiben, Admin kann) — alle
    bestanden, dann identisch gegen den echten Server über den
    SSH-Tunnel wiederholt (vorher `pg_dump`-Backup; `pg_dump`/`psql`
    14 passten nicht zur Serverversion 17, daher zusätzlich
    `postgresql@17` separat installiert, nicht gelinkt, nur für
    diesen Zugriff benutzt). Migration in
    `supabase_migrations.schema_migrations` manuell nachgetragen,
    Wegwerfinstanz abgebaut.
  - `src/features/academic/academicApi.ts`: direkte RLS-geschützte
    Tabellenzugriffe (kein SECURITY-DEFINER-Wrapper) — konsistent mit
    der bestehenden Begründung in der RLS-Migration, dass
    Schulorganisation „nicht identitäts-privilegiert-sensibel" ist,
    anders als Mitgliedschaften/Rollen. `src/types/database.types.ts`
    um echte, handgeschriebene `Tables`-Einträge für
    `school_years`/`classes`/`class_staff_assignments`/
    `class_memberships` erweitert (vorher nur `Functions`, da
    `.insert()` sonst nicht typsicher wäre — kein `supabase gen
    types`-Lauf möglich, wie schon in `database.types.ts` dokumentiert).
  - Neue Screens: `admin/school-years.tsx` (SCR-12, minimal: Liste +
    Anlegen; keine „aktive Periode"-Markierung, da die Spalte dafür
    nicht existiert) und `admin/classes.tsx` (SCR-13: Klassen anlegen,
    Klassenleitung zuweisen/beenden, Klassenliste pflegen). Kein neues
    `Select`-Komponente — einfacher Chip-Picker reicht für die kleinen
    Optionslisten (Schuljahre, Klassen).
  - Globale Suche (UX-DEC-07) ersetzt das in M7 als „noch nicht
    verfügbar" markierte Suchfeld in der TopBar: durchsucht Mitglieder
    und Klassen, beide über den normalen RLS-geschützten Client-Pfad
    (ein Nicht-Admin bekommt bei der Mitgliedersuche nur seine eigene
    Zeile, genau wie `admin/users.tsx` das für die Liste schon
    voraussetzt). Treffer verlinken auf die bestehenden Listen-Screens,
    da es noch keine Einzel-Detailseiten gibt.
  - **Bewusst nicht umgesetzt:** SCR-11 (Berechtigungen/Delegationen-
    UI), SCR-14/15 (Fächer/Kurse-UI), SCR-16 (Modulübersicht), SCR-17
    (Audit-Liste-UI) — Datenmodell/Backend existiert teils schon
    (`subjects`, `courses`, `audit_events`), aber keine eigene UI in
    dieser Runde; als Folgearbeit offen, nicht übersehen.
  - Verifiziert: `typecheck`/`lint`/`test`/`web:build` bestehen (neue
    Routen `/admin/school-years`, `/admin/classes` exportiert). Die
    Schema-/RLS-Ebene wurde wie oben beschrieben sowohl lokal als auch
    gegen den echten Server verifiziert. **Nicht visuell im Browser
    geprüft** — insbesondere der Chip-Picker, der Mitglieder-Picker mit
    Live-Filter und die globale Suche wurden nicht interaktiv
    getestet.
- **M11 (Berechtigungen/Delegation-UI, SCR-11): abgeschlossen** —
  `src/app/(app)/admin/permissions.tsx`, neue
  `listPermissionCatalog()`/`listPermissionGrants()` in
  `src/features/identity/adminApi.ts` (die Schreibfunktionen
  `grantPermission`/`revokePermission` gab es schon seit M4 — nur die
  UI fehlte bisher komplett).
  - Zeigt aktive Delegationen (Mitglied, Berechtigungscode,
    Begründung) mit Entzug per `ConfirmDialog` + Pflichtbegründung;
    neue Delegation über Mitglied-Suche + Berechtigungs-Chip +
    Pflichtbegründung.
  - Die eigentliche Autorisierungsregel (D-018) bleibt serverseitig in
    `fn_grant_permission`/`fn_revoke_permission`: nur die Schulleitung
    kann uneingeschränkt delegieren; ein Schuladmin braucht dafür
    selbst bereits `permissions.grant`. Das steht jetzt auch als
    Hinweistext auf dem Screen, statt den Fehlschlag kommentarlos
    unverständlich zu lassen.
  - Verifiziert: `typecheck`/`lint`/`test`/`web:build` bestehen (neue
    Route `/admin/permissions`); Tabellenschema (`permissions`,
    `permission_grants`) zusätzlich live gegen den echten Server über
    den Tunnel abgeglichen — passt exakt zu den neuen Queries. **Nicht
    visuell im Browser geprüft.**
- **M12 (Fächer/Kurse, Module, Audit — SCR-14/15/16/17): abgeschlossen**
  — die letzten vier offenen Screens aus der UI-Spezifikation:
  - `admin/subjects.tsx` (SCR-14): Liste + Anlegen, gleiches Muster wie
    `admin/school-years.tsx`.
  - `admin/courses.tsx` (SCR-15): Kurs anlegen (Fach- + Schuljahr-Chip-
    Picker), Kursmitglieder verwalten (`course_memberships` — dieselbe
    Tabelle, aus der M9s Dashboard-Widget „Meine Zuordnungen" schon
    liest). Entfernen ist hier ein echtes `DELETE`, nicht ein
    Soft-Revoke wie bei `class_memberships` — die Tabelle hat keine
    `ended_at`-Spalte, also auch keine Historie zu bewahren.
  - `admin/permissions.tsx`/`academicApi.ts` um
    `listSubjects`/`createSubject`/`listCourses`/`createCourse`/
    `listCourseMembers`/`addCourseMember`/`removeCourseMember`
    erweitert; die drei Vorkommen der School-ID-Auflösung (Schuljahr,
    Klasse, jetzt Fach/Kurs) dabei zu einer gemeinsamen
    `resolveOwnSchoolId()`-Hilfsfunktion zusammengezogen statt dreifach
    kopiert.
  - `admin/audit.tsx` (SCR-17): datensparsame Liste (Aktion, Zielart,
    Ergebnis, Begründung, Zeitpunkt) mit Textfilter; reiner Lesezugriff
    — `audit_events` hat ohnehin keinen Client-Schreibzugriff, nur
    `fn_write_audit_event` darf schreiben, und das ausschließlich aus
    den SECURITY-DEFINER-Funktionen heraus.
  - `admin/modules.tsx` (SCR-16): **bewusst kein Umschalt-UI** für
    `module_settings`. Foundation v0.1 hat kein einziges optionales
    Fachmodul, das auf diese Tabelle reagiert — ein Toggle ohne jede
    reale Wirkung wäre genau die „Scheinfunktion", die §6.7 der
    Spezifikation ausdrücklich verbietet. Stattdessen eine reine,
    read-only Übersicht der tatsächlich aktiven Foundation-Module.
  - Verifiziert: `typecheck`/`lint`/`test`/`web:build` bestehen (6 neue
    Routen exportiert: `/admin/subjects`, `/admin/courses`,
    `/admin/modules`, `/admin/audit` plus deren `(app)`-Varianten).
    Tabellenschema (`subjects`, `courses`, `course_memberships`,
    `audit_events`) zusätzlich live gegen den echten Server
    abgeglichen — passt exakt; `audit_events` ist dort aktuell leer
    (noch keine echten Admin-Aktionen live ausgeführt), der
    Empty-State-Pfad des Audit-Screens greift also korrekt. **Nicht
    visuell im Browser geprüft.**
- **M13 (echte Browser-Verifikation + drei real gefundene Bugs):
  abgeschlossen** — zum ersten Mal lief die App wirklich im Browser
  mit echtem Login gegen den echten Server (Puppeteer, da kein
  Browser-Tool in dieser Sitzung verfügbar war). Dabei kamen drei
  Bugs ans Licht, die alle bisherigen Prüfungen (immer nur rohes SQL
  oder `psql`, nie die echte REST-API) nie hätten finden können:
  1. **`20261015000001_m13_postgrest_profile_embed_fk.sql`**:
     `school_memberships.user_id` und `profiles.id` verweisen beide
     nur auf `auth.users.id`, aber es gab **keinen direkten
     Fremdschlüssel zwischen `school_memberships` und `profiles`**.
     PostgREST kann `select=...,profiles(...)` ohne echten FK nicht
     auflösen (`PGRST200`) — jede Einbettung von `profiles` über
     `school_memberships` schlug seit M4 fehl. Fix: fehlenden FK
     ergänzt (zusätzlich zum bestehenden, kein Ersatz — beide
     Constraints bleiben gleichzeitig erfüllbar, da `profiles.id`
     selbst schon über `auth.users.id` läuft).
  2. **`role_assignments`, `permission_grants` und
     `course_memberships` haben jeweils *zwei bzw. drei* Fremdschlüssel
     zur selben Zieltabelle** (z. B. `membership_id` vs.
     `assigned_by_membership_id`/`issued_by_membership_id`) — bloßes
     `role_assignments(...)` ist für PostgREST mehrdeutig (`PGRST201`,
     „300 Multiple Choices"). Fix: explizite FK-Hinweise
     (`role_assignments!role_assignments_membership_id_school_id_fkey(...)`
     usw.) in `adminApi.ts`, `useCurrentMember.ts` und
     `academicApi.ts` ergänzt — betraf M4s Mitgliederliste, M9s
     „Mein Konto"-Widget, M11s Berechtigungsliste und M12s
     Kursmitglieder gleichermaßen.
  3. **`20261015000002_m13_profiles_admin_visibility.sql`**: `profiles`
     hatte nur `profiles_select_own` (`id = auth.uid()`) — PostgREST
     wendet die RLS der eingebetteten Tabelle auch bei Embeds an, also
     bekam ein Schuladmin beim Laden anderer Mitgliederprofile über
     `school_memberships`/Rosters immer `null` zurück. Sichtbar im
     Screenshot: nur die eigene Zeile hatte einen Namen, alle anderen
     waren leer — Rollen/Status stimmten, weil die nicht von diesem
     Embed abhängen. Fix: neue `profiles_select_admin`-Policy
     (`fn_is_school_admin(school_id) or fn_has_role(school_id,
     'principal')`), zusätzlich zur bestehenden Eigenzugriffs-Policy.
     Verifiziert (Wegwerf-Postgres): Admin sieht jetzt alle ~5 Profile
     der eigenen Schule, weiterhin 0 aus der anderen Schule
     (Tenant-Trennung bleibt intakt), ein Schüler sieht weiterhin nur
     sich selbst.
  - Nebenbei: `ResponsiveDataList`s Aktionsspalte war mit fixen 160px
    zu schmal für zwei nebeneinanderliegende Buttons (im Screenshot
    am rechten Rand abgeschnitten) — auf `minWidth: 220` mit
    `flexWrap` umgestellt.
  - Beide Migrationen vollständig nach etablierter Disziplin
    verifiziert: Wegwerf-Postgres (inkl. neuer gezielter RLS-Checks
    für die Profil-Sichtbarkeit), dann mit vorherigem `pg_dump`-Backup
    gegen den echten Server angewendet, `NOTIFY pgrst, 'reload
    schema'` danach (nötig, weil alle Migrationen per `psql` statt
    über Supabase-Tooling laufen, das PostgREST sonst automatisch zum
    Neuladen anstößt).
  - Nach den Fixes per echtem Login (Puppeteer, `demo-a`/`admin.a`)
    alle zwölf Admin-Screens plus Dashboard neu durchgeklickt:
    Dashboard-Widgets, Mitgliederliste, Klassen/Fächer/Kurse-Roster
    und Berechtigungsliste zeigen jetzt durchgängig echte Daten ohne
    Konsolenfehler — zum ersten Mal in dieser Sitzung **tatsächlich
    visuell im Browser verifiziert**, nicht nur Schema-Ebene.

## Sicherheit

Niemals Service-Role-Keys oder andere privilegierte Geheimnisse im Frontend
oder in `EXPO_PUBLIC_*`-Variablen verwenden. Details: `doc/SECURITY_AUTH.md`.
