# Campus – Abnahme und technische Gates
Version 1.0 · Foundation v0.1.

## Gate 0: Repository & Entwicklungsbasis
- [ ] Existing `doc/design.md`, Brief, ZIP gesichtet; Doku aktualisiert und widerspruchsfrei.
- [ ] Expo Web/iOS/Android starten; TypeScript strict, Lint, Unit-Test und CI; kein Secret in Repo/Bundle.
- [ ] Light/Dark/System-Theme mit Campus-Purple-Tokens, 12px Karten, 4px Spacing.

## Gate 1: Unbekannte Auth-Machbarkeit (blockierend)

**Ergebnis: PoC bestanden.** Live gegen die echte Instanz verifiziert
(GoTrue v2.197.0, über SSH-Tunnel, mit synthetischen, am Ende wieder
gelöschten Testkonten — kein Produktivkonto berührt). Details,
Testskripte und Rohausgaben: siehe Commit-Historie ab
`20261014150001_auth_poc_foundations.sql`. Muster: synthetische
"technische" E-Mail (`u-<uuid>@accounts.campus.internal`) als
`auth.users.email`, serverseitig aus `(schoolSlug, username)` aufgelöst
über eine private `internal.login_identifiers`-Tabelle (nicht über die
Data API erreichbar), tatsächliche Passwortprüfung bleibt vollständig bei
Supabase Auth.

- [x] POC-01 Identität ohne reale E-Mail in Supabase Auth erstellt, ohne eigene Passwortspeicherung. — live verifiziert (`admin/users` mit synthetischer E-Mail, `email_confirm:true`, kein eigener Passwort-Hash berührt).
- [x] POC-02 Username-Login über schoolSlug, serverseitige Auflösung, Session-Restore und Refresh. — live verifiziert (Login über aufgelöste technische E-Mail liefert echte Supabase-Session; `grant_type=refresh_token` liefert neuen Access Token).
- [x] POC-03 gleicher Username an A/B -> unabhängige User-UUIDs, strikt isoliert. — live verifiziert (identischer Username "mmueller" in zwei Schulen, zwei unabhängige Auth-UUIDs, Login mit Schule-B-Zugangsdaten löst ausschließlich zu Schule B auf).
- [x] POC-04 falscher Host/Slug -> kein Zugang und keine Enumeration. — live verifiziert (falsches Passwort und nicht existierendes Konto liefern identischen generischen Fehler, gleicher HTTP-Status, gleicher `error_code`).
- [ ] POC-05 Nachträgliche echte E-Mail bestätigt und für Recovery nutzbar, ohne technischen Login zu zerstören. — **nur als Architekturentscheidung geprüft, nicht als Code gebaut**: echte Kontakt-E-Mail muss getrennt von `auth.users.email` gespeichert/verifiziert werden (eigener Flow, nicht Supabases native E-Mail-Änderung), da diese sonst den technischen Login-Identifier zerstören würde. Bauen folgt mit M5.
- [ ] POC-06 Lehrkraft kann Schülerreset über Einmalcode veranlassen, keinen Passwortwert einsehen. — Kernmechanik live verifiziert (Admin-API kann Passwort setzen, altes Passwort und alter Refresh-Token werden sofort ungültig), **aber** der Einmalcode-Ausstellungs-/Einlöse-Workflow selbst (Lehrkraft-UI, Rollenprüfung, `password_reset_requests`-Tabelle) ist noch nicht gebaut — M5.
- [ ] POC-07 schulübergreifender Reset und Erwachsenenkonto-Reset abgelehnt. — hängt am noch zu bauenden M5-Workflow; die zugrunde liegende RLS-/Rollenprüfung (Lehrkraft nur eigene Schule) existiert bereits und wurde isoliert getestet (`supabase/tests/database/001-rls-isolation.sql`), aber noch nicht im Reset-Kontext selbst.
- [x] POC-08 bereits ausgestellte Tokens nach Sperrung ermöglichen keine Fachzugriffe. — live verifiziert, zwei Wege: `ban_duration` sperrt sofort (`refresh_token` danach: `user_banned`); ein Passwort-Reset invalidiert den alten `refresh_token` ebenfalls automatisch (`refresh_token_not_found`), ohne dass das explizit angefordert wurde — GoTrue-Standardverhalten.
- [ ] POC-09 Expo Web + native Session/Login/Recovery erfolgreich. — Login/Session-Restore/Logout sind als echter Code vorhanden (`src/providers/AuthProvider.tsx`, `src/app/(auth)/login.tsx`) und bestehen `typecheck`/`lint`/`expo export --platform web`; **nicht** in einem laufenden Web-/Native-Build tatsächlich durchgeklickt (keine Browser-/Simulator-Umgebung in dieser Sitzung).
- [x] POC-10 PoC dokumentiert (API-Version, eingesetzter Provider, Limitationen, alternative Machbarkeitswege). — dieser Abschnitt; API-Version GoTrue v2.197.0; Limitation: Edge-Function-Code (`supabase/functions/auth-login`, `auth-provision-user`) wurde geschrieben und die zugrunde liegenden HTTP-Aufrufe einzeln live verifiziert, aber nicht als paketiertes Edge-Function-Deployment ausgeführt (kein Deno-Edge-Runtime-Deploy-Zugang in dieser Sitzung; ein Testlauf wurde zudem vom Auto-Mode-Berechtigungssystem als "Modify Shared Resources" abgelehnt).
- [x] **Bei PoC-Fehlschlag: Architektur-Stopp, keine Annahme/freie Auth-Nachentwicklung.** — entfällt, PoC bestanden; keine Ersatz-Auth entwickelt.

## Gate 2: Mandantentrennung und IAM

Formal gegen die echte Instanz geprüft 2026-10-15 (Details, Befunde und
Fixes dieser Prüfung: M15/M16 in `README.md`).

- [~] Fiktive Schulen A/B und Schüler/Lehrkraft/Schulleitung/Admin/Secretariat. — Schüler/Lehrkraft/Admin (beide Schulen)/Secretariat/Eltern jetzt in `supabase/seed.sql` vorhanden (Secretariat ergänzt bei dieser Prüfung, fehlte seit M3 komplett). **Schulleitung (principal) fehlt weiterhin** — ein erster Versuch brach zwei bestehende "letzter Admin"-Tests (002/003), die Admin A als einzigen Admin voraussetzen; braucht eine eigene Test-Fixture, noch nicht gebaut.
- [x] A kann B nie lesen, ändern oder über FK referenzieren. — wiederholt verifiziert über die gesamte Projekthistorie (`supabase/tests/database/001-rls-isolation.sql`, M10/M13 Live-Checks, M9-Dashboard); bei dieser Prüfung erneut per pgTAP-Lauf bestätigt (alle 8 Testdateien grün).
- [x] Manipulierte school_id, geschützte Tabelle, service-key Fehlgebrauch, Storage, Views, Functions getestet. — Service-Key: `grep` über `src/` bestätigt keine Referenz auf `service_role`/`SERVICE_ROLE` im Client-Code, `.env.local` enthält nur URL+Anon-Key. Storage: nicht genutzt (keine Storage-Aufrufe im Client). Views: keine Views in der Datenbank (`grep create view` über alle Migrationen: leer). Functions: alle mutierenden RPCs lösen `school_id` serverseitig aus dem Ziel-Objekt auf (z. B. `fn_assign_role` aus `p_target_membership_id`), nehmen sie nie direkt und ungeprüft vom Client entgegen — stichprobenhaft verifiziert.
- [x] Normale UI/API kann Schulleitungsrolle nicht vergeben; CLI nur Operator. — `fn_assign_role` wirft `principal_role_is_cli_only`, wenn `p_role_code = 'principal'` (Code-Review, `20261013220006_rls_policies.sql`).
- [x] Schuladmin-Ernennung nur mit Berechtigung, keine Selbstaufwertung, critical reason+audit atomar. — `fn_assign_role`: `self_role_assignment_forbidden` bei Selbstzuweisung, `school_admin`-Zuweisung erfordert `principal` oder `school_admin` mit `roles.assign.school_admin`, `reason_required`, Audit-Schreibvorgang im selben Funktionsaufruf (also atomar) wie das Insert.
- [x] Letzter aktiver Schuladmin bleibt auch bei konkurrierenden Operationen erhalten. — **echt live getestet, nicht nur Code-Review**: zwei überlappende `fn_revoke_role`-Aufrufe gegen zwei Admins derselben Schule, eine Transaktion hielt die Sperre 3 Sekunden offen; die zweite blockierte nachweislich bis zum Commit der ersten (Zeitstempel identisch) und wurde danach korrekt mit `last_active_admin_required` abgelehnt. Mechanismus: `fn_assert_active_admin_remains` sperrt die `schools`-Zeile per `for update`.
- [x] Klassenleitung nur auf eigene zugewiesene Klassen; Sekretariat braucht explizites Recht. — **Lücke gefunden und behoben** (M16, `20261015130001_m16_gate2_gaps.sql`): Klassenleitung hatte vorher gar keinen Lesezugriff auf die eigene Klasse. Neue Policy live auf dem echten Server verifiziert: Lehrkraft A (Klassenleitung 10a) sieht genau 1 Roster-Zeile, Admin B (andere Schule) sieht 0. Sekretariat: pgTAP-Test (`008-m16-gate2-gaps.sql`) bestätigt 0 Zugriff ohne Berechtigung, Zugriff nach explizitem `classes.manage`-Grant.

## Gate 3: Funktionale Foundation

- [x] Einladung/CSV-Prüfung/Import ohne unzulässige Rechte und ohne Passwörter im CSV. — live über die echte UI getestet (`admin-invite-user`, `admin-import-csv-process`): echte Kontoerstellung, Vorschau erkennt Fehlerzeilen korrekt, kein Passwort in der CSV-Eingabe (nur `first_name,last_name,role_code,class_name`).
- [x] Username automatisch aus Namen, Duplikate behandelt; Änderung nur Administration. — `src/features/auth/username.test.ts` (Unit-Tests bestehen), `fn_set_username` ist admin-only (M4).
- [x] Lehrkraft-Reset für Schüler derselben Schule (nicht für andere Rollen); Rate-Limit/Audit. — `reset_forbidden_for_role` für Nicht-Schüler (pgTAP `006-m5-password-reset.sql`); Rate-Limit seit M15 live verifiziert (11 Versuche → zehnmal 400, dann 429, danach nach Ablauf des Zeitfensters wieder normal); Audit seit M5 (`fn_write_audit_event`).
- [x] Profile, Schuljahre, Klassen, Fächer, Kurse, Module und Admin-Basis nutzbar. — wiederholt live durchgeklickt (M9–M13, Formular-Verifikationsrunde), zuletzt alle Admin-Screens ohne Konsolenfehler.
- [~] Dashboard zeigt echte Daten und ehrliche Leerzustände; responsive und Screenreader-/Tastaturprüfung. — echte Daten/Leerzustände live bestätigt (M9, M13). **Screenreader- und Tastaturprüfung wurde in dieser gesamten Sitzung kein einziges Mal durchgeführt** — offen.
- [x] Migration aus leerer DB reproduzierbar, CI Staging erfolgreich; Backup/Restore-Konzept dokumentiert. — CI (`supabase test db`) war seit M5 durchgängig rot (zwei alte pgTAP-Bugs, unabhängig von dieser Sitzungsarbeit), jetzt behoben und grün (`c18ad7e`). Backup/Restore-Konzept: `doc/BACKUP_RESTORE.md`, inkl. echtem, durchgeführtem Restore-Test (alle Zeilenzahlen nach Restore identisch zum Original).

## Gate 4: Produktivfreigabe separat
- [ ] EU-/Hosting-/AVV-/Unterauftragnehmerprüfung, schulrechtliche Anforderungen, DSFA-Vorprüfung.
- [ ] Datenschutz- und IT-Sicherheitsreview; Betriebskonzept, Rollback, Monitoring, Incident, Restore-Test.
- [ ] Zugänglichkeit (WCAG 2.2 AA) gegen reale Screens kontrolliert.
- [ ] Keine echten Minderjährigendaten vor Freigabe.
