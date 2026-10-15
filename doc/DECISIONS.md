# Campus – Verbindliches Entscheidungsregister
Version: 1.1 · 13.10.2026 · Status: beschlossene Produktregeln; technische PoC-Sperren gesondert.

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

## UI/UX-Entscheidungsrunde 11 – verbindlicher Nachtrag

Die UI/UX-Beschlüsse UX-DEC-01 bis UX-DEC-14 (Runden 9 und 10) bleiben unverändert. Die folgenden Entscheidungen wurden am 13.10.2026 in Runde 11 vom Produkteigentümer beschlossen. Die fachlichen Ausführungen stehen in `doc/UI_UX_DECISIONS_RUNDE_11.md` und `doc/UI_UX_SPECIFICATION.md` v1.2.

| ID | Wahl | Verbindlicher Beschluss |
|---|---|---|
| UX-DEC-15 | 11.1 B | Dashboard beginnt unmittelbar mit dem Widgetbereich; Begrüßung und Schulkontext sind sehr kompakt. |
| UX-DEC-16 | 11.2 A | „Mein Campus“ ist ein kompakter, fester, nicht ausblendbarer Bereich; Sicherheitshinweise erscheinen nur bei tatsächlichem Anlass separat. |
| UX-DEC-17 | 11.3 B | Rollen- und berechtigungsabhängige Widgets werden automatisch angeboten; keine manuelle Widget-Bibliothek zum Hinzufügen weiterer Typen in Foundation v0.1. |
| UX-DEC-18 | 11.4 A | Schüler: eigenes Konto sowie eigene Klasse und zugewiesene Kurse, soweit tatsächlich vorhanden und autorisiert. |
| UX-DEC-19 | 11.5 A | Lehrkräfte: zugewiesene Kurse, gegebenenfalls Klassenleitungen und direkter Einstieg in den geschützten Schüler-Passwortreset. |
| UX-DEC-20 | 11.6 A | Eltern: schulische Basisinformationen, eigenes Konto, Grundeinstellungen; keine Kinderansicht in Foundation. |
| UX-DEC-21 | 11.7 A | Sekretariat: Verwaltungs- und Einladungsfunktionen ausschließlich gemäß aktiven individuellen Berechtigungen/Delegationen. |
| UX-DEC-22 | 11.8 A | Schulleitung: kompakte Organisationskennzahlen aus freigegebenen Metadaten und autorisierte Verwaltungsaktionen. |
| UX-DEC-23 | 11.9 A | Schuladministration: Konten, Einladungen, Modulkonfiguration und tatsächlich vorhandene administrative Zustandsinformationen; kein genereller Zugang zu fachlichen Privatdaten. |
| UX-DEC-24 | 11.10 B | Bei mehreren Rollen ist eine Rollenansicht als Darstellungsfokus wählbar; wirksame Berechtigungen bleiben als Rollenunion mit Objektgrenzen und Verboten unverändert. |
| UX-DEC-25 | 11.11 A | Sinnvolle Rollenvorlagen; verfügbare optionale Widgets zugänglich sortieren, bei Eignung zwischen small/large ändern, ausblenden und Standard wiederherstellen. |
| UX-DEC-26 | 11.12 A | Leere Zustände sind kompakt und verständlich, mit sinnvoller Aktion nur bei Berechtigung; niemals vorgetäuschte reale Daten. |


**Klarstellung zu UX-DEC-17 und UX-DEC-25:** In Foundation werden verfügbare Widget-Typen automatisch bestimmt; der Benutzer kann **diese bereits verfügbaren optionalen Widgets** weiterhin zugänglich sortieren, ausblenden/einblenden, geeignete Größen ändern und zurücksetzen. Nur eine Bibliothek zum manuellen Hinzufügen beliebiger Widget-Typen wird auf später verschoben. UX-DEC-04 und UX-DEC-13 behalten ihre Gültigkeit.

**Klarstellung zu UX-DEC-24:** Die Rollenansicht ist nur ein visueller Dashboard-Fokus, kein Wechsel wirksamer Berechtigungen, kein Schulwechsel und kein internes Tabsystem. Die konkrete Persistenz der Rollenansicht wird erst in Runde 12 entschieden.

**Keine Vorwegnahme von Runde 12:** Die dort vorgeschlagenen Navigationseinzelheiten sind noch **nicht** beschlossen. Diese Ergänzung ändert weder die produktweiten D-001 bis D-024 noch Auth-/Hosting-/Legal-Gates.

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
