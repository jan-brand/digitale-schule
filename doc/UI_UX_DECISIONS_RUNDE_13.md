# Campus – UI/UX-Entscheidungsrunde 13: Navigationsausgestaltung

**Stand:** 21.10.2026  
**Status:** Beschlossene Produktentscheidungen UX-DEC-35 bis UX-DEC-39; keine Implementierung oder technische Abnahme.  
**Priorität:** Diese Runde ist für die hier geregelten UI/UX-Themen gegenüber widersprechenden Vorgaben der Runden 9 bis 12 und älteren UI/UX-Planungsannahmen vorrangig. Alle übrigen Entscheidungen bleiben bestehen. Unverändert zwingend sind Mandantentrennung, Authentifizierung, Autorisierung/RLS, Datenschutz, Sicherheits- und rechtliche Freigabegates sowie die Grenze zwischen Foundation v0.1 und späteren Fachmodulen. Siehe [Entscheidungsregister](DECISIONS.md) und [Runde 12](UI_UX_DECISIONS_RUNDE_12.md).

## 1. Beschlüsse

| ID | Verbindliche Produktentscheidung |
|---|---|
| **UX-DEC-35** | Die mobile Bottom-Bar bietet **„Start“ als festen Eintrag** und weitere **automatisch nach tatsächlich verfügbaren Funktionen und wirksamen Berechtigungen priorisierte Schnellziele**. Die vollständige berechtigte Navigation bleibt über das **zusätzliche Seitenmenü in der Kopfzeile** (UX-DEC-28) erreichbar. Eine **spätere manuelle Personalisierung** ist vorgemerkt, aber derzeit **nicht freigegeben**. Der visuelle Dashboard-Rollenfokus ändert keine Berechtigungen oder verfügbare Navigationsziele. |
| **UX-DEC-36** | Die aufgabenorientierten Kategorien heißen **Startseite**, **Lernen & Lehren**, **Kommunikation**, **Schulorganisation**, **Administration** und **Mein Konto**. Die Bezeichnungen sind für alle Rollen gleich. Kategorien ohne tatsächlich verfügbare, berechtigte Ziele erscheinen nicht als aktive Navigation; unimplementierte Fachmodule werden nicht vorgetäuscht. Themenbezogene persönliche Kurszuordnungen und geschützte organisatorische Kursverwaltung dürfen unterschiedliche Einstiege auf dieselbe autorisierte Funktion bieten. |
| **UX-DEC-37** | Die Desktop-Sidebar wird manuell ein-/ausgeklappt. **Eingeklappt bleibt eine schmale Icon-Leiste** mit verständlichen zugänglichen Namen, erkennbarem Aktivzustand und erreichbaren Unterpunkten bestehen. Ihr Ein-/Ausklappzustand wird **automatisch lokal je Gerät** gespeichert. |
| **UX-DEC-38** | Die Wahl zwischen Desktop-Sidebar und mobiler Hybrid-Navigation richtet sich **automatisch nach der tatsächlich verfügbaren Layoutbreite**, nicht nach der Gerätebezeichnung. Drehung, Split-Screen und Zoom lösen bei Bedarf einen Wechsel aus, ohne Neuanmeldung, Änderung der aktuellen Route oder Rechte. Konkrete Breakpoints werden anhand von Geräte- und Accessibility-Tests bestimmt. |
| **UX-DEC-39** | **Lokale gerätebezogene Navigationspräferenzen** umfassen den Sidebar-Einklappzustand und geöffnete/geschlossene Themengruppen. **„Navigation zurücksetzen“** stellt ausschließlich diese lokalen Navigationszustände auf Standardwerte zurück, nicht Widgets, Rollenansicht, Kontostatus oder Rechte. Falls zukünftig manuell personalisierbare Schnellzugriffe ausdrücklich freigegeben werden, sollen ihre persönlichen Präferenzen **pro schulgebundenem Konto** gespeichert und zwischen Geräten synchronisiert werden. Diese Funktion ist noch nicht Teil des aktuellen Lieferumfangs. |

**Konkretisierung und Vorrang:** UX-DEC-35 ersetzt für die Bottom-Bar abweichende feste ältere Ziele wie „Übersicht · Schule · Mehr“: „Start“ ist fest; weitere Ziele sind dynamisch und berechtigungsabhängig. Das separate Kopfbereichs-Menü bleibt gemäß UX-DEC-28 vollständig erreichbar. UX-DEC-36 konkretisiert UX-DEC-29; UX-DEC-37 konkretisiert UX-DEC-27; UX-DEC-38 konkretisiert UX-DEC-06/28; UX-DEC-39 ergänzt UX-DEC-11/34 ohne die kontogebundene Rollenfokus-Speicherung auf lokal zurückzusetzen.

## 2. Abnahmekriterien

| Test-ID | Erwartetes Ergebnis |
|---|---|
| UX13-T01 | „Start“ ist fest in der mobilen Bottom-Bar erreichbar. |
| UX13-T02 | Weitere Schnellziele bestehen ausschließlich aus aktuellen, implementierten und berechtigten Funktionen. |
| UX13-T03 | Mehrfachrollen werden gemäß effektiver Rechteunion berücksichtigt; der Dashboard-Rollenfokus ändert weder Rechte noch erlaubte Ziele. |
| UX13-T04 | Die vollständige berechtigte Navigation bleibt über ein getrennt erreichbares mobiles Seitenmenü zugänglich; direkte URL-Aufrufe werden serverseitig geprüft. |
| UX13-T05 | Die sechs beschlossenen Hauptkategorien haben bei allen Rollen dieselben Bezeichnungen. |
| UX13-T06 | Vollständig leere oder nicht verfügbare Kategorien erscheinen nicht als aktive Menüpunkte. |
| UX13-T07 | Gruppen sind mit Maus, Tastatur, Touch und Screenreader verständlich zu öffnen und zu schließen. |
| UX13-T08 | Alle produktiv erreichbaren Ziele besitzen reale Routen und wirksame Autorisierung; spätere Module werden nicht als funktional dargestellt. |
| UX13-T09 | Desktop-Sidebar lässt sich manuell ein-/ausklappen. |
| UX13-T10 | Eingeklappt bleiben erkennbare Icons mit zugänglichen Namen und erreichbaren Unterpunkten. |
| UX13-T11 | Aktiver Navigationspunkt bleibt in beiden Zuständen erkennbar. |
| UX13-T12 | Sidebar-Zustand übersteht erneutes Öffnen auf demselben Gerät. |
| UX13-T13 | Navigationsmodus folgt verfügbarer Breite statt Gerätekennung. |
| UX13-T14 | Bei Gerätedrehung erfolgt falls nötig ein automatischer Wechsel ohne Neuanmeldung. |
| UX13-T15 | Zoom und geteilte Fenster schneiden Ziele nicht ab und verhindern keine Eingabe. |
| UX13-T16 | Route, Mandantenkontext und Rechte bleiben beim Layoutwechsel unverändert. |
| UX13-T17 | Geöffnete/geschlossene Gruppen werden lokal gespeichert und wiederhergestellt. |
| UX13-T18 | „Navigation zurücksetzen“ setzt Sidebar und Gruppen auf definierte Standards zurück. |
| UX13-T19 | Reset verändert keine Konto-, Rollen-, Berechtigungs-, Dashboard- oder Rollenfokus-Präferenzen. |
| UX13-T20 | Lokale Präferenzen enthalten keine geschützten Schuldatensätze; veraltete Zielreferenzen verleihen keine Berechtigung; zukünftige persönliche Schnellzugriffe bleiben fachlich und technisch vom lokalen Gerätezustand getrennt. |

## 3. Umsetzungsvorschlag (keine zusätzlichen Produktbeschlüsse)

1. **Navigationsmodell:** `src/components/navigation/navItems.ts` von flacher Liste auf gruppierte, typisierte Navigation umbauen; Verfügbarkeit und Berechtigungen nach tatsächlich geladenem Schulkontext bestimmen.
2. **Desktop:** `src/components/layout/Sidebar.tsx` erhält echte Icons, Gruppen, erreichbare Unterpunkte und zugänglichen Kompaktzustand; lokale Persistenz erhalten.
3. **Mobil:** `src/components/layout/BottomNavigation.tsx`, `TopBar.tsx` und `AppShell.tsx` auf dynamische Bottom-Bar und getrenntes vollständiges Seitenmenü umstellen.
4. **Responsive:** Die bisher vereinfachte Breitenumschaltung durch geprüfte adaptive Breakpoints ersetzen; Tablet, Rotation, Split-Screen, Zoom und große Textgrößen testen.
5. **Präferenzen:** Lokalen Sidebar- und Gruppenzustand versionieren; „Navigation zurücksetzen“ als harmlose, reversible Einstellung bereitstellen. Rollenauswahl gemäß UX-DEC-34 weiterhin separat im schulgebundenen Konto speichern.
6. **Tests:** UX13-T01–T20 und UX12-T01–T24 inklusive Regression, RLS-/IAM-Gates, Fokusführung, Offline-/Fehlerzuständen und Web/iOS/Android prüfen.

## 4. Offene rein technische Details

Konkrete Zahl/Reihenfolge der dynamischen Bottom-Bar-Einträge; Icon-Satz; Sidebar-Breiten; Gruppenzuordnung der einzelnen Foundation-Routen und Reihenfolge; zugängliche Untermenüs im Kompaktzustand; standardmäßig offene Gruppen; Verhalten der aktuellen aktiven Gruppe; Form des Reset-Zugangs; Breakpoints; Performance, Cache-Invalidierung und Versionierung lokaler Navigationseinstellungen.

**Gültigkeitsgrenze:** Diese Beschlüsse sind die verbindliche fachliche Planung, keine Aussage über bereits bestandene Tests oder freigegebene Module. Die Implementierung folgt erst mit separatem Entwicklungsauftrag.
