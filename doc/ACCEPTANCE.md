# Campus – Abnahme und technische Gates
Version 1.0 · Foundation v0.1.

## Gate 0: Repository & Entwicklungsbasis
- [ ] Existing `doc/design.md`, Brief, ZIP gesichtet; Doku aktualisiert und widerspruchsfrei.
- [ ] Expo Web/iOS/Android starten; TypeScript strict, Lint, Unit-Test und CI; kein Secret in Repo/Bundle.
- [ ] Light/Dark/System-Theme mit Campus-Purple-Tokens, 12px Karten, 4px Spacing.

## Gate 1: Unbekannte Auth-Machbarkeit (blockierend)
- [ ] POC-01 Identität ohne reale E-Mail in Supabase Auth erstellt, ohne eigene Passwortspeicherung.
- [ ] POC-02 Username-Login über schoolSlug, serverseitige Auflösung, Session-Restore und Refresh.
- [ ] POC-03 gleicher Username an A/B -> unabhängige User-UUIDs, strikt isoliert.
- [ ] POC-04 falscher Host/Slug -> kein Zugang und keine Enumeration.
- [ ] POC-05 Nachträgliche echte E-Mail bestätigt und für Recovery nutzbar, ohne technischen Login zu zerstören.
- [ ] POC-06 Lehrkraft kann Schülerreset über Einmalcode veranlassen, keinen Passwortwert einsehen.
- [ ] POC-07 schulübergreifender Reset und Erwachsenenkonto-Reset abgelehnt.
- [ ] POC-08 bereits ausgestellte Tokens nach Sperrung ermöglichen keine Fachzugriffe.
- [ ] POC-09 Expo Web + native Session/Login/Recovery erfolgreich.
- [ ] POC-10 PoC dokumentiert (API-Version, eingesetzter Provider, Limitationen, alternative Machbarkeitswege).
- [ ] **Bei PoC-Fehlschlag: Architektur-Stopp, keine Annahme/freie Auth-Nachentwicklung.**

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
