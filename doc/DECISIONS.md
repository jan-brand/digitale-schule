# Campus – Verbindliches Entscheidungsregister
Version: 1.0 · 13.10.2026 · Status: beschlossene Produktregeln; technische PoC-Sperren gesondert.

## Geltung und Vorrang
Diese Datei konsolidiert die Beschlüsse aus den Planungsrunden. Sie ersetzt widersprechende **Planungsannahmen** in älteren Dokumenten, nicht automatisch vorhandenen Code. Änderungen per Architecture Decision Record (ADR) und Freigabe; Originaldokumente erhalten. Produktname und Domain sind vorläufig.

| ID | Beschluss | Status |
|---|---|---|
| D-001 | Campus ist SaaS für einzelne allgemeinbildende Schulen in Deutschland; ein Campus = eine Schule. | Verbindlich |
| D-002 | Keine Schulträger- oder schulübergreifenden Fachverwaltungsrollen, keine Datenübertragung zwischen Schulen. | Verbindlich |
| D-003 | Gemeinsames Supabase-Projekt, eine PostgreSQL-Datenbank; Schulmandanten logisch über `school_id`, SQL-Constraints und RLS getrennt. | Verbindlich |
| D-004 | Pro Schule **separate fachliche Auth-Konten**, ohne Identitätsverknüpfung oder schulübergreifenden Kontowechsel; gleicher Benutzername in verschiedenen Schulen zulässig. | Verbindlich |
| D-005 | Eigene Web-Subdomain je Schule; Domain selbst ist Platzhalter. | Verbindlich |
| D-006 | React Native, Expo Router, React Native Web, TypeScript strict, Supabase Auth, PostgreSQL, Storage, Edge Functions; kein NestJS/Prisma/eigener Passwortspeicher. | Verbindlich |
| D-007 | Web zuerst, iOS/Android parallel lauffähig; Campus Purple und WCAG 2.2 AA als Ziel. | Verbindlich |
| D-008 | Schulinternes Einladungsverfahren; CSV-Import mit Prüfung; keine öffentliche Selbstregistrierung. | Verbindlich |
| D-009 | Anmeldung über Benutzername + Passwort; E-Mail optional, vom Benutzer ergänzbar; verifizierte E-Mail für Benachrichtigungen und Recovery. | Verbindliche Produktanforderung, technische Machbarkeit offen |
| D-010 | Benutzernamen automatisch aus Vor-/Nachname; Admin darf korrigieren; spätere Änderungen nur berechtigte Schuladministration. | Verbindlich |
| D-011 | Jede aktive Lehrkraft darf Schülerpasswort-Reset innerhalb ihrer Schule veranlassen; nie Passwort einsehen. | Verbindlich |
| D-012 | Reset mit verifizierter E-Mail oder kontrolliert ausgehändigtem Einmalcode. | Verbindlich; Mechanismus PoC |
| D-013 | Mehrere Rollen innerhalb einer Schule möglich, Rechte werden vereinigt; Ressourcenbedingungen und Sicherheitsverbote haben Vorrang. | Verbindlich |
| D-014 | Standardrollen mit katalogisierten dauerhaften Zusatzrechten bis Widerruf; nur berechtigt delegierbar. | Verbindlich |
| D-015 | Schuladministration und berechtigtes Sekretariat laden ein; Sekretariat darf Klassenleitungen nur mit Zusatzrecht zuweisen. | Verbindlich |
| D-016 | Klassenleitung = Lehrkraft mit klassenbezogener Zuständigkeit, keine globale Klassenleitungsrolle. | Verbindlich |
| D-017 | Schuladmin-Ernennung durch Schulleitung oder Admin mit Sonderrecht; Schulleitungs-Ernennung ausschließlich geschützte Betreiber-CLI. | Verbindlich |
| D-018 | Schulleitung darf Rechte aus beschränktem Katalog auch ohne separates Delegationsrecht vergeben; keine Selbstaufwertung. | Verbindlich |
| D-019 | Letzter aktiver Schuladministrator nicht regulär entfernbar; Recovery/Notfall über geschützte CLI. | Verbindlich |
| D-020 | Für kritische Rechteänderungen Berechtigungsprüfung, Pflichtbegründung und Audit, keine zweite Freigabe. | Verbindlich |
| D-021 | Zusatzrechte dauerhaft bis Entzug, aber nur bei gültigem Konten-/Mitgliedschaftsstatus wirksam. | Verbindlich |
| D-022 | Austritt deaktiviert schulgebundene Mitgliedschaft; Aufbewahrung/Löschung regelgebunden, nicht pauschal unbegrenzt. | Verbindlich |
| D-023 | Foundation v0.1 zuerst, dann wenige Fachmodule vollständig; keine Noten/Messenger/Klassenbuch/automatische Stundenplanung in Foundation. | Verbindlich |
| D-024 | Schulbereitstellung und Notfallverwaltung über separat autorisierte Betreiber-CLI. | Verbindlich |

## Verdrängte ältere Annahmen
- Kein zentraler Benutzer mit mehrfachen Schulmitgliedschaften; keine automatische Wiederherstellung einer zuletzt genutzten **anderen** Schule.
- `organizations` und Schulträgerhierarchie entfallen aus Foundation.
- `school_memberships` darf als **schulinterner Lebenszyklusdatensatz** erhalten bleiben, muss jedoch streng 1:1 zwischen Auth-Identität und Schule sein.
- Plattformoperator ist keine normale Schulrolle; kein genereller Fachdateneinblick.

## Entscheidungen mit offener technischer Freigabe
- **GATE-AUTH:** Benutzername/Passwort ohne echte E-Mail über Supabase Auth inklusive Recovery, Session und API-Sicherheit nachweisen. Keine künstliche E-Mail als verifiziert ausgeben.
- **GATE-HOST:** Wildcard-Subdomains inklusive TLS, DNS, Routing und Expo-Web-Hosting bei ausgewähltem Anbieter testen.
- **GATE-LEGAL:** Region, AVV, Unterauftragnehmer, Datenschutz-Folgenabschätzungsprüfung, landesrechtliche Aufbewahrung, Eltern-/Minderjährigen-Aktivierung, Backup/Restore, Sicherheitsreview vor Echtdaten.

## Technische Arbeitsdefaults – keine nachträgliche Produktentscheidung
npm mit Lockfile; GitHub Actions; Expo-kompatible stabile Versionen; Vitest für Pure-Logic, pgTAP/SQL-Integration für RLS, Playwright-Web-Smoke; geschützte Edge Functions. Änderungen daran mit Begründung dokumentieren.
