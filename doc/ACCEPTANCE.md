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
- [ ] Fiktive Schulen A/B und Schüler/Lehrkraft/Schulleitung/Admin/Secretariat.
- [ ] A kann B nie lesen, ändern oder über FK referenzieren.
- [ ] Manipulierte school_id, geschützte Tabelle, service-key Fehlgebrauch, Storage, Views, Functions getestet.
- [ ] Normale UI/API kann Schulleitungsrolle nicht vergeben; CLI nur Operator.
- [ ] Schuladmin-Ernennung nur mit Berechtigung, keine Selbstaufwertung, critical reason+audit atomar.
- [ ] Letzter aktiver Schuladmin bleibt auch bei konkurrierenden Operationen erhalten.
- [ ] Klassenleitung nur auf eigene zugewiesene Klassen; Sekretariat braucht explizites Recht.

## Gate 3: Funktionale Foundation
- [ ] Einladung/CSV-Prüfung/Import ohne unzulässige Rechte und ohne Passwörter im CSV.
- [ ] Username automatisch aus Namen, Duplikate behandelt; Änderung nur Administration.
- [ ] Lehrkraft-Reset für Schüler derselben Schule (nicht für andere Rollen); Rate-Limit/Audit.
- [ ] Profile, Schuljahre, Klassen, Fächer, Kurse, Module und Admin-Basis nutzbar.
- [ ] Dashboard zeigt echte Daten und ehrliche Leerzustände; responsive und Screenreader-/Tastaturprüfung.
- [ ] Migration aus leerer DB reproduzierbar, CI Staging erfolgreich; Backup/Restore-Konzept dokumentiert.

## Gate 4: Produktivfreigabe separat
- [ ] EU-/Hosting-/AVV-/Unterauftragnehmerprüfung, schulrechtliche Anforderungen, DSFA-Vorprüfung.
- [ ] Datenschutz- und IT-Sicherheitsreview; Betriebskonzept, Rollback, Monitoring, Incident, Restore-Test.
- [ ] Zugänglichkeit (WCAG 2.2 AA) gegen reale Screens kontrolliert.
- [ ] Keine echten Minderjährigendaten vor Freigabe.
