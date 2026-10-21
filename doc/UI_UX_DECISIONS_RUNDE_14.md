# Campus – UI/UX-Entscheidungsrunde 14: Navigationsverhalten

**Stand:** 21.10.2026  
**Status:** Produktentscheidungen UX-DEC-40 bis UX-DEC-44 beschlossen. Keine Implementierung oder bestandene Tests.  
**Vorrang:** Für die hier geregelten UI/UX-Fragen gelten diese neueren Beschlüsse vor widersprechenden UI/UX-Vorgaben der Runden 9–13. Nicht widersprechende Beschlüsse gelten weiter. Sicherheits-, Datenschutz-, IAM-, RLS- und schulgebundene Mandantentrennungsregeln sowie Freigabegates bleiben unangetastet. Grundlage: [Runde 12](UI_UX_DECISIONS_RUNDE_12.md), [Runde 13](UI_UX_DECISIONS_RUNDE_13.md), [Entscheidungsregister](DECISIONS.md).

## 1. Beschlüsse

| ID | Verbindliche Entscheidung |
|---|---|
| **UX-DEC-40** | Die mobile Bottom-Bar enthält **maximal fünf Einträge**, darunter immer **„Start“**. Weitere Einträge werden automatisch anhand tatsächlich verfügbarer und berechtigter Funktionen priorisiert. Die **globale Suche hat hohe Priorität, sofern Platz vorhanden ist**, ist aber kein immer fester Bottom-Bar-Eintrag. Bei geringer Breite oder großer Schrift sind weniger Einträge zulässig. Das zusätzliche mobile Seitenmenü erhält alle berechtigten Ziele; der Dashboard-Rollenfokus beeinflusst die Berechtigungen nicht. |
| **UX-DEC-41** | Wird eine Unterseite aufgerufen, deren Navigationsgruppe geschlossen ist, öffnet sich diese **automatisch und nur temporär**; andere geöffnete Gruppen bleiben unverändert. Der aktive Unterpunkt wird erkennbar markiert. Die situative Öffnung **überschreibt keine lokal gespeicherten Gruppenpräferenzen** (UX-DEC-39). |
| **UX-DEC-42** | In der kompakten Desktop-Icon-Sidebar führt das **bewusste Anklicken eines Gruppensymbols** zur **Erweiterung der vollständigen Sidebar** und öffnet die gewählte Gruppe mit beschrifteten Unterpunkten. Die anderen Gruppen müssen nicht geschlossen werden. Manuelles erneutes Einklappen bleibt möglich. Ob diese Erweiterung die gespeicherte Sidebar-Präferenz überschreibt, ist noch nicht fachlich entschieden; bis zur technischen Klärung als situatives Verhalten behandeln. |
| **UX-DEC-43** | **„Navigation zurücksetzen“** liegt unter **„Mein Konto → Einstellungen → Navigation“**. Ein zugänglicher **Bestätigungsdialog** mit „Abbrechen“ und „Navigation zurücksetzen“ erscheint vor Ausführung. Zurückgesetzt werden nur lokal gespeicherte Sidebar- und Gruppenzustände, **nicht** Widgets, Dashboard-Rollenfokus, Konto, Rollen oder Rechte. Erfolgsanzeige erst nach bestätigter lokaler Speicherung; Fehler deutlich anzeigen. |
| **UX-DEC-44** | Ein responsiver Wechsel zwischen Sidebar und mobiler Hybrid-Navigation erfolgt mit **kurzem, dezentem Übergang ohne Verlust der aktuellen Route, Formularentwürfe oder des fachlichen Kontextes** und ohne erzwungene Neuanmeldung. Bei aktivierter Einstellung **„Bewegung reduzieren“** ist die dekorative Animation deaktiviert. **Offene Navigationsmenüs schließen** beim Wechsel; der Tastaturfokus wechselt zu einem sinnvollen weiterhin vorhandenen Bedienelement. Keine Rechte- oder Mandantenänderung. |

## 2. Konsistenz und Umsetzungsgrenzen

- UX-DEC-40 konkretisiert die rollen-/berechtigungsabhängige Bottom-Bar aus UX-DEC-35; UX-DEC-28 verlangt weiterhin ein zusätzliches, vollständiges mobiles Seitenmenü. Globale Suche bleibt über die normale Sucheinstiegsaktion gemäß UX-DEC-31 erreichbar.
- UX-DEC-41 ergänzt UX-DEC-29, UX-DEC-36 und lokale Gruppenpersistenz aus UX-DEC-39: **temporärer UI-Zustand ist nicht automatisch gespeicherte Präferenz**.
- UX-DEC-42 ergänzt die kompakte Sidebar aus UX-DEC-37. Ein bewusstes Öffnen einer Gruppe darf nicht unbemerkt durch einen späteren Seitenwechsel den vom Nutzer gespeicherten Ausgangszustand überschreiben.
- UX-DEC-43 konkretisiert die Reset-Funktion aus UX-DEC-39. Ein Dialog vor dem Zurücksetzen ist ausdrücklich beschlossen.
- UX-DEC-44 konkretisiert das breitenabhängige, automatische Tablet-Layout aus UX-DEC-38. Die App Shell soll Fachscreens möglichst stabil montiert lassen; Browser-Zoom, Rotation, Split-Screen, Tastatur und Screenreader sind zu testen.
- Für alle fünf Beschlüsse gelten serverseitige Autorisierung/RLS und schulgebundene Datenisolation. Nicht implementierte Fachmodule werden niemals als produktiv nutzbar vorgetäuscht.
- Dieses Dokument **ändert nicht** den Foundation-v0.1-Scope oder die Gate-Anforderungen.

## 3. Abnahmekriterien UX14-T01 bis UX14-T20

| ID | Prüfkriterium |
|---|---|
| UX14-T01 | Bottom-Bar enthält höchstens fünf Einträge. |
| UX14-T02 | „Start“ ist für jedes aktive berechtigte Konto unabhängig vom visuellen Dashboard-Rollenfokus fest erreichbar. |
| UX14-T03 | Suche wird bei verfügbarem Platz bevorzugt, bleibt aber unabhängig von der Bottom-Bar über den globalen Sucheinstieg erreichbar. |
| UX14-T04 | Bei geringer Breite und großer Schrift sinkt die Zahl der Schnellziele ohne abgeschnittene/unbedienbare Labels; restliche Ziele bleiben im Seitenmenü erreichbar. |
| UX14-T05 | Die Gruppe der aktiven Unterseite wird bei Navigation bei Bedarf automatisch geöffnet. |
| UX14-T06 | Andere bereits geöffnete Gruppen bleiben erhalten. |
| UX14-T07 | Automatische Gruppenöffnung überschreibt die lokalen Gruppenpräferenzen nicht. |
| UX14-T08 | Aktive Unterseite ist visuell und für Screenreader erkennbar. |
| UX14-T09 | Klick auf ein Gruppensymbol der kompakten Sidebar erweitert die gesamte Sidebar. |
| UX14-T10 | Angeforderte Gruppe öffnet sich mit vollständigen beschrifteten und berechtigten Unterpunkten. |
| UX14-T11 | Danach kann die Sidebar wieder manuell eingeklappt werden. |
| UX14-T12 | Gruppenaktivierung und Sidebarsteuerung funktionieren mit Maus, Touch und Tastatur bei nachvollziehbarem Fokus. |
| UX14-T13 | Reset ist unter Mein Konto → Einstellungen → Navigation erreichbar. |
| UX14-T14 | Zugänglicher Dialog mit „Abbrechen“ und „Navigation zurücksetzen“ erscheint vor der Aktion. |
| UX14-T15 | Abbrechen ändert nichts; bestätigter Reset betrifft ausschließlich lokale Navigationspräferenzen. |
| UX14-T16 | Erfolg erscheint erst nach bestätigter Speicherung, Speicherfehler sind erkennbar. |
| UX14-T17 | Beim responsiven Layoutwechsel bleiben aktuelle Route und ungespeicherte Formularentwürfe erhalten. |
| UX14-T18 | Wechsel animiert dezent; mit aktivierter Reduktion von Bewegung ohne dekorative Animation. |
| UX14-T19 | Offene Navigationsmenüs schließen beim Layoutwechsel, Fokus wird auf ein weiterhin verfügbares sinnvolles Element gesetzt. |
| UX14-T20 | Layoutwechsel ändern weder Schule, Rechte noch fachliche Daten und erzwingen keine erneute Anmeldung. |

## 4. Umsetzungspakete (Planung, keine Implementierung)

1. **Zentrales Navigationsmodell:** Typisierte Gruppen, Berechtigungen, Route, Icon und Schnellzielpriorität (`src/components/navigation/navItems.ts`).
2. **Desktop-Sidebar:** echte Icons, aufklappbare Gruppen, situative Öffnungen, manuelle Steuerung und lokale Persistenz (`src/components/layout/Sidebar.tsx`).
3. **Mobile Schnellnavigation:** bis zu fünf berechtigte Ziele, bevorzugte Suche und getrenntes volles Seitenmenü (`src/components/layout/BottomNavigation.tsx`, `TopBar.tsx`).
4. **Responsive App Shell:** Breitenwechsel mit erhaltenem Seiten-/Formularzustand, Fokusmanagement und Reduced Motion (`src/components/layout/AppShell.tsx`).
5. **Navigationsreset:** Kontoeinstellungen, Bestätigungsdialog, gezieltes Rücksetzen lokaler Präferenzen und Fehlerbehandlung.
6. **Test und Abnahme:** UX14-T01–T20 zusammen mit UX12-T01–T24 und UX13-T01–T20, Mandantentrennungs- und Accessibility-Regression auf Web/iOS/Android.

## 5. Noch nicht entschiedene technische Einzelheiten

Konkrete Reihenfolge der dynamischen Schnellziele; praktische Breakpoints und Animationsdauer; beim bewusst ausgelösten Sidebar-Ausklappen genaue Persistenz; Fokusziel im Responsive-Wechsel; Rücksetzungsvorgabewerte für Gruppen; Scroll-/Formularzustand bei plattformspezifischen Layoutwechseln.

**Abnahmehinweis:** Die 20 Kriterien sind Soll-Tests, keine bereits bestandenen Tests.
