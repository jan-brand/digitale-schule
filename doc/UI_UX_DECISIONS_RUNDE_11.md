# Campus – UI/UX-Entscheidungsrunde 11: Dashboard und Rollenansichten

**Stand:** 13.10.2026  
**Status:** Die zwölf Entscheidungen UX-DEC-15 bis UX-DEC-26 sind vom Produkteigentümer verbindlich beschlossen.  
**Geltung:** Campus Foundation v0.1, soweit nicht ausdrücklich als spätere Ausbaustufe bezeichnet.  
**Quellen:** Bisherige `doc/DECISIONS.md` (D-001 bis D-024), `doc/UI_UX_SPECIFICATION.md` v1.1 (UX-Runden 9/10), `doc/design.md` und die bestätigten Antworten aus Runde 11.  
**Wichtig:** Dieses Dokument ist ein Entscheidungsnachtrag und kein Nachweis bereits implementierter Funktionen. Die Vorschläge für Runde 12 sind **nicht** beschlossen.

## 1. Verbindliche Entscheidungen

| ID | Abstimmung | Beschluss |
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


## 2. Verbindliche Abgrenzung gegen Missverständnisse

### Automatische Auswahl **und** einfache Personalisierung

UX-DEC-17 (11.3 B) und UX-DEC-25 (11.11 A) gelten **gleichzeitig**:

- **Automatische Widget-Bereitstellung:** Welche Widget-Typen für ein Konto überhaupt verfügbar sind, bestimmen aktive Rollen, wirksame Rechte und echte Foundation-Daten. Es gibt in v0.1 **keinen** separaten Widget-Marktplatz oder frei auswählbare Widget-Bibliothek.
- **Personalisierung dieser bereitgestellten Widgets:** Optionale Widgets dürfen sortiert, ausgeblendet und wieder eingeblendet sowie – sofern unterstützt – auf `small` oder `large` gestellt werden. „Standard wiederherstellen“ setzt auf das zulässige Rollenlayout zurück.
- **Pflicht-/Sicherheitselemente:** W-01 „Mein Campus“ bleibt sichtbar. W-06 „Sicherheitshinweis“ erscheint bei tatsächlichem Anlass und bleibt dann sichtbar. Beide können nicht wegkonfiguriert werden.
- Diese Konkretisierung setzt die bisherigen UX-DEC-04 und UX-DEC-13 fort und **hebt die bereits beschlossene Personalisierung nicht auf**.

### Rollenansicht ist keine Rollenumschaltung

UX-DEC-24 bedeutet nur die Auswahl eines **visuellen Schwerpunkts innerhalb derselben Schule**. Die Auswahl:

- erstellt, entzieht oder aktiviert keine Rollen und keine Zusatzrechte;
- verändert weder die wirksamen Berechtigungen noch RLS, SQL-Grants, Schul- oder Objektscopes;
- ist kein Schulwechsel, keine neue Anmeldung und keine Campus-interne Tab-Navigation;
- zeigt ausschließlich aus tatsächlicher Mitgliedschaft abgeleitete Ansichten an;
- muss nach Rollenentzug/deaktivierter Mitgliedschaft auf einen zulässigen Zustand zurückfallen und geschützte Daten invalidieren.

Die spätere Entscheidung, **wo** die zuletzt gewählte Rollenansicht gespeichert wird (lokal oder serverseitig), gehört zu Runde 12 und ist noch offen. Bereits beschlossene Speicherung harmloser **Widget-Präferenzen** je schulgebundenem Benutzerkonto bleibt bestehen.

## 3. Geschützter Funktionsumfang je Rolle

| Rolle | Dashboard-Inhalte Foundation v0.1 | Nicht ableitbar / geschützt |
|---|---|---|
| Schüler | Eigene Klasse, eigene Kurszuordnungen, eigenes Konto, freigegebene Schule | Keine fremden Schülerprofile, keine Noten/Stundenpläne aus späteren Modulen |
| Lehrkraft | Zugewiesene Kurse, Klassenleitung, sicherer Reset-Einstieg für Schüler derselben Schule | Kein Passwort lesen/setzen; kein Reset für Erwachsene oder andere Schulen |
| Eltern | Freigegebene Schulinformationen, eigenes Konto/Einstellungen | Keine Kinder- oder Leistungsansicht in Foundation |
| Sekretariat | Zulässige Mitglieder-/Einladungs-/Organisationsfunktionen | Keine Funktion ohne individuelle Berechtigung |
| Schulleitung | Zulässige Verwaltungsaktionen und aggregierte Metadaten-Kennzahlen | Keine pauschalen sensiblen Unterrichts- und Profildaten |
| Schuladministration | Zulässige Konto-, Einladungs-, Modul- und Verwaltungsstatusfunktionen | Keine Betreiber-CLI und kein genereller Fachdateneinblick |

Auch wenn Rollen kombiniert werden, gelten Ressourcenzuordnung, `school_id`, Objektzugriffsregeln und vorrangige Verbote unverändert.

## 4. Foundation vs. spätere Versionen

**Foundation v0.1 (beschlossen):** Kleines responsives Raster, `small`/`large`, echte autorisierte Basisdaten, automatisch verfügbare Widgets, einfache Anpassung, optionale Rollenansicht bei Mehrfachrolle, Pflicht-/Sicherheitsstatus, sinnvolle Leer- und Fehlerzustände.

**Später (nicht Foundation):** Frei ergänzbare Widget-Typen aus Fachmodulen, komplexe Widgetbibliothek, Stundenplan-, Aufgaben-, Messenger-, Noten-, Kalender- und andere spezialisierte Dashboards. Keine Fake-Live-Inhalte.

## 5. Technische Empfehlungen (nicht zusätzliche Produktbeschlüsse)

1. Eine zentrale Dashboard-Konfiguration liefert Standard-Widgets nach aktiven Rollen; die Filterung der **Daten** erfolgt serverseitig mit RLS und fachlicher Autorisierung.
2. Widget-Layoutpräferenzen sind Darstellungsdaten und dürfen nie als Rechtequelle dienen. `small`/`large`, Reihenfolge und Sichtbarkeit mit versionsfähigem Schema speichern.
3. Rollenwechsel im Dashboard soll den Fokus und die Widget-Reihenfolge verändern, nicht Autorisierungsregeln. Direkte URLs/andere Verwaltungsansichten bleiben entsprechend effektiver Rechte zugänglich.
4. Der nach erfolgter Anmeldung nicht mehr zulässige Rollenfokus fällt ohne Offenlegung fremder Daten auf einen verfügbaren Standard zurück.
5. Keine echten rollenabhängigen Dashboard-Daten anbinden, bevor Auth-/IAM-/RLS-Gates bestanden sind. Für noch nicht fertiggestellte Flows ehrlich „Nicht verfügbar“ statt Erfolg vortäuschen.

## 6. Dokumentenhierarchie und Übernahme

- Übergeordnet bleiben `doc/DECISIONS.md`, `doc/ARCHITECTURE.md` und `doc/SECURITY_AUTH.md` für Schule/Identität/Rechte/Sicherheit.
- Neue Dashboarddetails aus Runde 11 konkretisieren `doc/UI_UX_SPECIFICATION.md` v1.1 und ältere **Layoutvorschläge**; frühere verbindliche Beschlüsse bleiben gültig.
- Ältere Aussagen über ein zentrales fachliches Konto mit mehreren Schulen gelten gemäß D-004 **nicht**.
- Die exakten Breakpoints, technische Widget-Persistenzstruktur und Erstrollenvorbelegung sind noch Implementierungsdetails; nicht ohne Not als neue Beschlüsse kennzeichnen.
- Für Runde 12 sind lediglich Fragen vorbereitet; deren Vorschläge sind nicht in dieses Entscheidungsregister aufgenommen.
