# Campus – UI/UX-Entscheidungsrunde 12 (verbindlich, Vorrangfassung)

## Verbindlicher Vorrang – UI/UX-Entscheidungsrunde 13 (21.10.2026)

**UX-DEC-35 bis UX-DEC-39 sind für die von ihnen geregelten Navigations- und UI-Präferenzthemen die jüngsten vorrangigen Produktentscheidungen.** Sie ersetzen bei inhaltlichem Konflikt ältere UI/UX-Vorgaben, einschließlich Runden 9–12 (beispielsweise feste mobile Bottom-Bar-Belegung). Andere UX-Beschlüsse gelten weiter. Unverändert zwingend bleiben Authentifizierung, Mandantentrennung, serverseitige Berechtigungen/RLS, Datenschutz, Sicherheitsregeln und Freigabegates. Die verbindlichen Beschlüsse, 20 Abnahmekriterien und Umsetzungsgrenzen stehen in [UI_UX_DECISIONS_RUNDE_13.md](UI_UX_DECISIONS_RUNDE_13.md).


**Stand:** 20.10.2026  
**Status:** Vom Produkteigentümer beschlossene Produktentscheidungen UX-DEC-27 bis UX-DEC-34. Keine Implementierungsfreigabe und kein Nachweis bereits funktionierender Features.  
**Priorität:** **Höchste Priorität für die von Runde 12 geregelten UI/UX-Themen.** Bei sachlichen Widersprüchen ersetzen diese neueren Beschlüsse die Aussagen und UI/UX-Details aus Runde 9–11 und älteren Planungsdokumenten, auch wenn diese zuvor als verbindlich markiert wurden. Keine stille Rücknahme von nicht widersprechenden Beschlüssen. **Nicht überschrieben** werden Authentifizierungs-, Mandantentrennungs-, Berechtigungs-, Datenschutz- und Sicherheitsinvarianten (D-001 bis D-024, ARCHITECTURE, SECURITY_AUTH). Diese bleiben zwingende Grenzen, und produktiver Betrieb erfordert weiterhin die gesonderten Gates. Die Priorität betrifft **Produkt-/UI-Entscheidungen**, nicht Sicherheitskontrollen.

## 1. Beschlussregister

| ID | Beschluss | Vorrang und Präzisierung |
|---|---|---|
| UX-DEC-27 | **Desktop:** dauerhafte, links angeordnete, einklappbare Seitenleiste mit beschrifteten, berechtigungsabhängigen Einträgen. | Bestätigt UX-DEC-01; bei abweichenden älteren Layoutdetails gilt Runde 12. |
| UX-DEC-28 | **Smartphone:** **Hybrid** aus unterer Navigationsleiste für häufig verwendete Ziele **und zusätzlich über die Kopfzeile zugänglichem Seitenmenü** für die vollständige, berechtigungsabhängige Navigation. | Ersetzt abweichende Detailvorgaben aus UX-DEC-02 und Abschnitt 4 der UI_UX_SPECIFICATION, soweit diese ausschließlich „Mehr“ als Zugang zum Seitenmenü oder eine feste Bottom-Bar-Belegung vorschreiben. Konkrete Buttons werden noch festgelegt; eine doppelte „Mehr“-/Hamburger-Funktion ist bei Umsetzung auf Verständlichkeit zu prüfen. |
| UX-DEC-29 | **Modulnavigation:** thematisch gruppiert, Gruppen ein- und ausklappbar, ausschließlich tatsächliche verfügbare/berechtigte Ziele. | Konkretisiert die ältere Informationsarchitektur; bestehende Foundation-Funktionen bleiben erreichbar. |
| UX-DEC-30 | **Reguläre Inhaltsseiten:** klassischer Seitenkopf mit Titel, ggf. Beschreibung, primärer berechtigter Aktion, anschließend Filtern/Inhalt; **Breadcrumbs auf möglichst allen geeigneten Seiten**. | Neue Priorität gegenüber gegenteiligen älteren Layoutvorschlägen. Dashboard-Ausnahme aus UX-DEC-15/16 bleibt: kompakt, kein Hero. Mobile Breadcrumbs dürfen gekürzt werden, müssen zugänglich bleiben. |
| UX-DEC-31 | **Globale, berechtigungsabhängige Suche** mit Schnellzugriff; über sichtbaren Sucheinstieg und **Strg+K / ⌘K** auf Desktop erreichbar. | Erweitert UX-DEC-07. Globaler Einstieg bleibt leicht auffindbar; die konkrete Position folgt aktueller Runde 12, wenn frühere Vorgaben der gewünschten responsiven App-Shell entgegenstehen. |
| UX-DEC-32 | **Benachrichtigungen:** zentral erreichbare Glocke mit Vorschau, vollständiger Benachrichtigungszentrale (Verlauf/Filter/Einstellungen) und **numerischem Ungelesen-Zähler**. | Neuer Zielzustand. W-06 Sicherheitsstatus aus UX-DEC-16 bleibt unabhängig verpflichtend. Kein stillschweigender Auftrag für Push, E-Mail, Messenger oder Fachmodule in Foundation v0.1. |
| UX-DEC-33 | **Dashboard-Rollenansicht:** Auswahl ausschließlich im festen Bereich **„Mein Campus“**. Bei nur einer gültigen Rollenansicht keine Auswahl. | Konkretisiert UX-DEC-24. Keine globale Rollenschaltfläche, kein Schul-/Kontowechsel, keine Änderung von Navigation oder effektiven Rechten. |
| UX-DEC-34 | **Persistenz:** bevorzugten visuellen Rollenfokus serverseitig **im schulgebundenen Konto** und damit geräteübergreifend speichern. Wird eine gespeicherte Rolle ungültig, **automatisch auf gültige Standardansicht wechseln**. | Schließt offene Frage 12.8. Bei gesperrtem/deaktiviertem Konto keinen Dashboard-Fallback anzeigen, sondern Zugriff verweigern. Keine Rollen- oder Berechtigungsänderung durch Präferenzen. |

**Auflösung älterer Konflikte:** Insbesondere hat UX-DEC-28 als neuere bewusste Produktwahl Vorrang vor dem älteren Standard „Übersicht · Schule · Mehr“ und der Beschränkung auf optional einen vierten Eintrag in der Bottom-Bar. Diese alten Einträge können als *Implementierungsvorschlag*, nicht als verpflichtende Festlegung, verwendet werden. UX-DEC-31 bleibt mit dem älteren globalen Suchziel kompatibel. UX-DEC-32 ist die später auszubauende Benachrichtigungsoberfläche, nicht die Freigabe von Fach-Events für v0.1.

## 2. Unveränderliche Schutzregeln

- Ein Benutzerkonto gehört fachlich genau zu einer Schule; kein schulübergreifendes Kontenmodell und kein Wechsel durch UI-Präferenzen.
- Mehrfachrollen innerhalb einer Schule bleiben nach effektiver Rechteunion, Objektrestriktionen und Sicherheitsverboten autorisiert; **Rollenfokus ist nur Darstellung**.
- Serverseitige Berechtigungsprüfung und RLS müssen für Navigation, Suche, Schnellzugriff, Benachrichtigungen und Detailziele gelten. UI-Sichtbarkeit allein ist keine Sicherheitskontrolle.
- Bei Entzug, Sperrung oder Statusänderungen geschützte Daten und Caches invalidieren; kein vorübergehendes Aufblitzen unzulässiger Inhalte.
- W-01 „Mein Campus“ bleibt nicht ausblendbar, W-06 wird bei tatsächlichem Anlass angezeigt und bleibt dann sichtbar. Die bestehende Widget-Personalisierung bleibt erhalten.
- Keine fiktiven Live-Inhalte, keine unbeschlossenen produktiven Stundenplan-, Aufgaben-, Messenger-, Kalender- oder Notenfunktionen in Foundation v0.1.

## 3. Abnahmekriterien UX12-T01 bis UX12-T24

| ID | Testbarer Soll-Zustand |
|---|---|
| UX12-T01 | Desktop-Seitenleiste ist links vorhanden, ein-/ausklappbar und bleibt bedienbar. |
| UX12-T02 | Aktive Einträge und einklappbare Icons sind sichtbar und für Tastatur/Screenreader verständlich bezeichnet. |
| UX12-T03 | Navigation und direkte URLs geben ohne serverseitiges Recht keine geschützten Inhalte frei. |
| UX12-T04 | Smartphone-Bottom-Bar ist Safe-Area-gerecht, zugänglich und verdeckt keine Aktionen. |
| UX12-T05 | Das zusätzliche Seitenmenü ist erreichbar, schließbar und enthält sämtliche aktuell berechtigten Ziele. |
| UX12-T06 | Bottom-Bar, Seitenmenü und Desktop bieten dieselben autorisierten Zielseiten ohne inkonsistente Rechte. |
| UX12-T07 | Thematische Gruppen ordnen alle freigegebenen Module nachvollziehbar ein. |
| UX12-T08 | Gruppen lassen sich mit Touch, Tastatur und Screenreader ein-/ausklappen. |
| UX12-T09 | Bei Rollen- oder Rechteänderung werden Gruppen/Einträge aktualisiert und unzulässige Inhalte invalidiert. |
| UX12-T10 | Reguläre Seiten zeigen konsistente Titel, Hauptaktionen und Inhaltsstruktur; Aktionen nur bei Recht. |
| UX12-T11 | Breadcrumbs verlinken auf reale, berechtigte Hierarchien und unterstützen Browser-Zurück. |
| UX12-T12 | Mobile Breadcrumbs sind ohne horizontales Scrollen nutzbar; Dashboard bleibt gemäß Runde 11 kompakt. |
| UX12-T13 | Die globale Suche öffnet sich über sichtbaren Einstieg und Strg+K/⌘K (bei passender Desktop-Plattform). |
| UX12-T14 | Suche, Vorschläge, Trefferzahl, Snippets und Schnellzugriff geben keine Fremdschul- oder unberechtigten Personendaten preis. |
| UX12-T15 | Suche und Schnellzugriff bieten Tastatur-/Screenreader-Bedienung, Lade-, Leer-, Fehler- und Kein-Recht-Zustände. |
| UX12-T16 | Die Glocke zählt ausschließlich tatsächlich ungelesene, aktuell autorisierte Benachrichtigungen korrekt. |
| UX12-T17 | Vorschau und vollständige Zentrale sind zugänglich; Verlauf/Filter/Einstellungen und erlaubte Zielnavigation funktionieren bei vorhandenen Ereignisquellen. |
| UX12-T18 | Sicherheitsstatus W-06 ist von normalen Benachrichtigungen unabhängig und kann bei Anlass nicht wegkonfiguriert werden. |
| UX12-T19 | Die Rollenansicht-Auswahl steht nur bei mindestens zwei verschiedenen gültigen aktiven Rollen im Dashboard „Mein Campus“ zur Verfügung. |
| UX12-T20 | Rollenfokusänderung verändert weder serverseitige Rechte/RLS noch Schule oder Navigation. |
| UX12-T21 | Fokussierte Widgets verwenden nur tatsächlich autorisierte Daten; bei Fokus- oder Rollenwechsel wird sicher invalidiert. |
| UX12-T22 | Gültiger Fokus wird nach erneuter Anmeldung und auf einem zweiten Gerät desselben Schulaccounts wiederhergestellt. |
| UX12-T23 | Nach Rollenentzug ungültigen Fokus verwerfen und gültigen Standard wählen; bei Kontosperre/Deaktivierung Zugang verweigern und Cache leeren. |
| UX12-T24 | Präferenzen sind schulaccount-isoliert, gegen unzulässige Werte serverseitig validiert; Speicherfehler werden sichtbar und ohne falsche Erfolgsmeldung behandelt. |

## 4. Offene Implementierungsdetails (nicht vorwegnehmen)

- Pixelbreiten, Breakpoints, Tablet-Anpassung und Animationen.
- Konkrete mobile Bottom-Bar-Ziele, Priorisierung der häufigen Ziele, Verhältnis von Hamburger und „Mehr“, sowie endgültige Themenkategorien.
- Verhalten der eingeklappten Gruppen auf verschiedenen Geräten, Persistenz des UI-Zustands.
- Breadcrumb-Kürzung und genaue Aktionspositionen bei engen Viewports.
- Suche: indexbasierte oder direkte autorisierte Abfragen, Ranking, verfügbare Foundation-Entitätstypen, Performance und Rate-Limits. Bereits vorhandene Foundation-Suche ist nicht zu entfernen.
- Benachrichtigungen: Ereignisquellen, Zustellkanäle, Aufbewahrung, Lesestatus-Synchronisation, datenschutzkonforme Logs sowie exakter Rollout (v0.1 gegenüber später).
- Präferenzschema, zulässiger Default-Fokus, Schreib-/Offline-/Retry-Strategie und Cache-Invalidierung.
- Geräte-, Zoom-, Tastatur-, Screenreader- und echte Native-Smoke-Tests vor Implementierungsabnahme.

## 5. Übernahme und Abnahme

Dieser Nachtrag hat **inhaltlichen Vorrang für seine acht UI/UX-Themen** gegenüber allen entgegenstehenden früheren UI/UX-Vorschlägen und -Beschlüssen im Repository. Bereits beschlossene nicht widersprechende UX-Regeln bleiben bestehen; Sicherheits-/Architekturgrenzen sind nicht Gegenstand einer Aufhebung. Texte in älteren Dokumenten müssen unter diesem ausdrücklichen Vorrang gelesen werden, bis sie redaktionell harmonisiert sind.

Fachliche Entscheidung bedeutet **nicht** Implementierung, CI-Erfolg, rechtliche Freigabe oder produktiven Betrieb. Technische Abnahme setzt nachgewiesene Tests UX12-T01–T24 und die weiterhin geltenden bestehenden Gates voraus.
