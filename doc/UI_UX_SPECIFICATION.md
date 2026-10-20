# Campus – UI/UX-Spezifikation für Foundation v0.1

**Version:** 1.2 (UI/UX-Runden 9 bis 11; Beschlüsse verbindlich)  
**Stand:** 13.10.2026  
**Geltung:** Foundation v0.1, mit Erweiterungsregeln für spätere Schulmodule  
**Basis:** Campus-Entscheidungsregister D-001 bis D-024, `doc/design.md`, UI-Entscheidungsrunden 9, 10 und 11. Die neuen Beschlüsse UX-DEC-15 bis UX-DEC-26 in Abschnitt 17 konkretisieren den Dashboard-Teil. Sie haben gegenüber älteren Dashboard-Layoutvorschlägen Vorrang, nicht gegenüber Sicherheitsregeln.

## 1. Status und Verbindlichkeit

### Verbindliche neue Entscheidungen
| ID | Entscheidung |
|---|---|
| UX-DEC-01 | Desktop/Web: linke, einklappbare Seitenleiste. |
| UX-DEC-02 | Smartphone: untere Hauptnavigation plus „Mehr“-Menü. |
| UX-DEC-03 | Einheitlicher Dashboard-Aufbau, rollenspezifische Inhalte. |
| UX-DEC-04 | Dashboard-Widgets dürfen umsortiert und teilweise ausgeblendet werden; Pflichtinformationen bleiben sichtbar. |
| UX-DEC-05 | Administration ist integriert und erscheint nur bei passender Berechtigung. |
| UX-DEC-06 | Tablets erhalten ein adaptives Layout zwischen Mobil- und Desktopdarstellung. |

### Bestehende unveränderte Entscheidungen
- Ein Campus = eine Schule; separate schulgebundene Identitäten; kein Kontowechsel zwischen Schulen.
- Gemeinsames Supabase-Projekt mit RLS-Mandantentrennung.
- Login über Benutzername/Passwort; optionale verifizierte E-Mail. **Technisches Gate AUTH ist noch nicht bestanden.**
- Eigene Schul-Subdomain im Web; **Hosting-Gate noch offen**.
- Expo Router, React Native Web, TypeScript strict, Campus Purple, WCAG 2.2 AA als Ziel.

**Verbindlichkeit:** Die UX-Entscheidungen sind beschlossen. Nicht eigens beschlossene Breakpoints, Pixelmaße, Persistenztechnik und technische Detail-Flows bleiben **Implementierungsvorschläge**. Sie ändern keine Produkt- oder Sicherheitsentscheidung.

## 2. Design-Tokens und Erscheinungsbild

| Token | Light | Dark |
|---|---|---|
| `color.background` | `#F8F7FC` | `#120C1D` |
| `color.surface` | `#FFFFFF` | `#1D152A` |
| `color.text.primary` | `#1A1028` | `#F7F3FF` |
| `color.action.primary` | `#4C1D95` | `#A78BFA` |
| `color.accent.soft` | `#F1EAFF` | `#302046` |

- Kartenradius: 12 px; Abstandsgrid: 4 px (4/8/12/16/24/32...).
- Weitere Tokens für `border`, `text.secondary`, `focus`, `success`, `warning`, `danger`, Hover, Pressed und Disabled **ableiten, auf Kontrast prüfen und dokumentieren**; nicht frei als Markenfarben ausgeben.
- Schrift skaliert gemäß Systempräferenz; semantische Komponenten statt feste Pixelhöhen.
- Theme `system | light | dark`; Default `system`. Lokal direkt anwenden, optional pro schulgebundenem Konto serverseitig synchronisieren. Kein Theme-Flash auf Start.
- Interaktionszustände: normal, hover (Web), focus-visible, pressed, selected, disabled, loading, error, success.
- Keine Farbe als einziges Bedeutungssignal. Icons mit Label oder Accessibility-Name.
- Inhalte in deutscher Sprache; Datum/Uhrzeit im deutschen Format; interne Daten ISO 8601.

## 3. Informationsarchitektur

### Globale Navigation – Foundation
1. **Übersicht** (`/dashboard`) – alle Rollen.
2. **Schule** (`/school`) – freigegebene Stamminformationen; Unterpunkte je Berechtigung.
3. **Verwaltung** (`/admin`) – nur bei mindestens einer gültigen Verwaltungsberechtigung.
4. **Profil & Einstellungen** (`/settings`) – alle angemeldeten Rollen.
5. **Lade indikatoren** - Wenn Prozesse von der  Netzwerk-geschwindigkeit oder Bandbreite abhängig sind, sollte ein Ladesymbol oder ein sonsitger Indikator dafür festgelegt sein; dieser muss systemweit einheitlich sein.
### Admin-Unterpunkte nach Berechtigung
- Mitglieder / Einladungen / CSV-Import.
- Rollen und Zusatzrechte (geschützt; kritische Änderungen mit Pflichtbegründung).
- Schuljahre.
- Klassen und Klassenleitungszuordnungen.
- Fächer.
- Kurse und Kurszuweisungen.
- Modulaktivierung.
- Audit (nur für besonders berechtigte Nutzer; kein unbeschränkter Fachdateneinblick).

**Nicht in Foundation als funktionierende Menüs:** Stundenplan, Vertretungsplan, Aufgaben, Messenger, Kalender, Klassenbuch, Noten, Dateiablage, Abwesenheiten, Ganztag, KI, Integrationen. Dokumentierte `coming soon`-Kacheln sind erlaubt, aber keine irreführenden klickbaren Funktionen.

### Navigation nach Rollen
| Rolle | Immer sichtbar | Bedingt sichtbar |
|---|---|---|
| Schüler | Übersicht, Profil & Einstellungen | Schulprofil, zugewiesene Metadaten |
| Lehrkraft | Übersicht, Profil & Einstellungen | Klassen-/Kurs-Metadaten, schulische Kontoresets |
| Eltern | Übersicht, Profil & Einstellungen | Nur explizit freigegebene Schulinfos; **keine Kinderansichten in Foundation** |
| Sekretariat | Übersicht, Profil & Einstellungen | Einladungen, Klassen-/Kursverwaltung nach Delegation |
| Schulleitung | Übersicht, Profil & Einstellungen | Schulverwaltung, erlaubte Berechtigungsverwaltung |
| Schuladministrator | Übersicht, Profil & Einstellungen | Schuladmin-Funktionen entsprechend Rechtekatalog |

Bei mehreren Rollen werden verfügbare Navigationsziele vereinigt, **nicht** automatisch alle schulischen Inhalte freigegeben. Jedes Ziel hat zusätzlich eine serverseitige Autorisierungsprüfung.

## 4. Responsive App Shell

### Vorgeschlagene Breakpoints (Layoutbreite, nicht Geräteklasse)
| Breite | Layout | Navigation |
|---|---|---|
| `< 768` dp/CSS px | Mobile | Bottom Navigation + Mehr-Menü |
| `768–1199` | Tablet/kleines Web | Einklappbare/temporäre Seitenleiste; bei schmalem Tablet Bottom Bar |
| `>= 1200` | Desktop | Linke Seitenleiste, ein-/ausklappbar |

Breakpoints sind nach visuellen und Accessibility-Tests anzupassen. Auf Tablet gelten Inhalte und ausreichende Touch-Ziele als Entscheidungskriterium, nicht nur eine feste Pixelgrenze. Bei großen Schriftgrößen muss die Navigation ebenfalls funktionieren.

### Desktop
- Seitenleiste links; erweitert: ca. 256 px, eingeklappt: ca. 72 px (Vorschlag).
- Ein-/Ausklappen durch zugänglichen Button; Zustand je Gerät speichern.
- Eingeklappte Icons erhalten Tooltip und eindeutigen Accessibility-Namen.
- Aktiver Navigationspunkt durch Farbe **und** Form/Markierung sichtbar.
- Hauptbereich mit maximal sinnvoller Lesebreite; Tabellen dürfen größere Breiten verwenden.
- Topbar: Campus-Name, Seitentitel, Theme-/Account-Menü; **kein Schulwechsel**.

### Smartphone
- Untere Navigation: **Übersicht**, **Schule**, **Mehr**; optional ein vierter dynamischer Eintrag nur nach späterer Freigabe.
- „Mehr“ öffnet Liste der weiteren erlaubten Ziele (insbesondere Einstellungen und Verwaltung).
- Safe Area, Bildschirmtastatur, Screenreader und Geräte-Rotation unterstützen.
- Keine versteckte Verwaltung durch rein visuelle Tricks: Menü-Sichtbarkeit ist nur UX, Backend/RLS erzwingt die Rechte.

### Tablet
- Zwei-Spalten-Inhalte, wenn Platz verfügbar; keine erzwungene Desktop-Navigation.
- Seitenleiste bei ausreichender Breite, ansonsten Bottom Navigation + Mehr.
- Formulare und Admin-Tabellen können in Karten- oder Listenansichten wechseln.

### Gemeinsame Shell-Zustände
- **Bootstrapping:** Theme, Session und schulinterne Identität werden geprüft; keine kurzzeitige Anzeige fremder Daten.
- **Unauthenticated:** Login/Recovery ohne App Shell.
- **Authenticated:** rollenabhängige Shell, aktive schulgebundene Identität.
- **Suspended/disabled:** Zugriff verweigert, sichere Logout-/Support-Option.
- **Offline/network error:** deutlicher Zustand mit Wiederholen; keine irreführenden Erfolgsanzeigen.
- **No permission:** „Keine Berechtigung“, ohne sensible Informationen.

## 5. Screen-Spezifikation Foundation v0.1

| Screen-ID | Route (Vorschlag) | Inhalte und Aktionen | Zugang |
|---|---|---|---|
| SCR-01 | `(auth)/login` | Schulbranding aus geprüfter Subdomain, Benutzername, Passwort, Anzeigen/Verbergen, Login, Recovery-Link, Fehler- und Rate-limit-Zustände | Öffentlich, schulbezogen |
| SCR-02 | `(auth)/recover` | Wahl: verifizierte E-Mail oder schulischer Einmalcode; einheitliche neutrale Meldungen | Öffentlich, schulbezogen |
| SCR-03 | `(auth)/reset` | Einmalnachweis, neues Passwort, Bestätigung, Erfolg/Fehler/Ablauf | Nach sicherer Prüfung |
| SCR-04 | `(app)/dashboard` | Widgetorientierte Startseite mit kompaktem „Mein Campus“, optionalem Rollenansicht-Fokus, bedingten Pflichtmeldungen, autorisierten Widgets und anpassbaren bereits verfügbaren Widgets | Angemeldet |
| SCR-05 | `(app)/school` | Name, Kontaktdaten und freigegebene Stammdaten der eigenen Schule | Angemeldet |
| SCR-06 | `(app)/settings` | Profil, Theme, optionale E-Mail-Verifizierung, Passwort- und Session-Aktionen | Angemeldet |
| SCR-07 | `(app)/admin/index` | Admin-Übersicht nur mit erlaubten Bereichen, Warnhinweise | Berechtigter Benutzer |
| SCR-08 | `admin/members` | Suche/Filter, Status, erlaubte Aktionen; keine unnötigen privaten Daten | Admin/Delegation |
| SCR-09 | `admin/invitations` | Verlauf der über „Mitglied einladen“ erstellten Konten mit dem aktuellen Status der jeweiligen Mitgliedschaft; Sperren/Reaktivieren statt Widerruf — abweichend vom hier ursprünglich skizzierten asynchronen Token-Verfahren, siehe `20261016000001_m19_invitation_lifecycle.sql` für die Begründung | Berechtigt |
| SCR-10 | `admin/imports` | CSV wählen, Vorschau, Zeilenfehler, Duplikate, Bestätigung, Ergebnis | Berechtigt |
| SCR-11 | `admin/permissions` | Rollen/Delegationen, Grenzen anzeigen, Pflichtbegründung, Auditbestätigung | Besonders berechtigt |
| SCR-12 | `admin/school-years` | Liste, Anlage, Bearbeitung, aktive Periode | Berechtigt |
| SCR-13 | `admin/classes` | Liste/Formular, Schuljahr, Klassenleitungen | Berechtigt |
| SCR-14 | `admin/subjects` | Liste/Formular | Berechtigt |
| SCR-15 | `admin/courses` | Liste/Formular, Zuordnung zu Fach, Schuljahr, Klasse/Lehrkraft | Berechtigt |
| SCR-16 | `admin/modules` | Aktivierte Module; spätere Module nur als nicht verfügbar kennzeichnen, keine Scheinfunktion | Berechtigt |
| SCR-17 | `admin/audit` | Datenminimierte Auditliste, Filter, Begründung kritischer Änderungen | Audit-Sonderrecht |
| SCR-18 | `not-found / forbidden` | Kontextbezogene, sichere Fehler- und Rücknavigation | Alle |

Die tatsächlichen Router-Pfade dürfen im Implementierungsdetail angepasst werden; Screen-IDs und Nutzerverhalten bleiben referenzierbar.

## 6. Dashboard und Widgets (aktualisiert durch Runde 11)

### 6.1 Verbindlicher Grundaufbau

1. **Unmittelbarer Widget-Einstieg:** Das Dashboard beginnt direkt mit seinem Inhalt; kein großflächiger Begrüßungs- oder Hero-Block. Eine persönliche Begrüßung bleibt optional **sehr kompakt**.
2. **„Mein Campus“ (W-01):** Oben als kompakter, fest sichtbarer Bereich oder kompakte feste Widgetzeile. Nur eigene Schule und für den Benutzer freigegebene Schulmetadaten, niemals Schulwechsel.
3. **Rollenansicht bei mehreren aktiven Rollen:** Eine beschriftete, zugängliche Auswahl steuert **nur den Schwerpunkt** der Widgetdarstellung, nicht Navigation oder Rechte. Bei einer einzigen Rolle ist keine Auswahl nötig.
4. **Automatisch verfügbare Widgets:** Widgets werden nach aktiven schulbezogenen Rollen, Objektbeziehungen, Berechtigungen und wirklich vorhandenen Foundation-Daten angeboten; ohne frei durchsuchbare Widget-Typenbibliothek.
5. **Bedingte Sicherheitshinweise (W-06):** Bei tatsächlichem, serverseitig/zuverlässig ermitteltem Anlass gesondert sichtbar; nicht ausblendbar, solange relevant. Keine generische Fake-Warnung.
6. **Klare Zustände:** Loading, keine Daten, Fehler, keine Berechtigung, offline – ohne erfundene Daten und ohne Erfolgsmeldung vor Serverbestätigung.

### 6.2 Foundation-Widgetkatalog

| Widget-ID | Zweck / Datenquelle | Automatische Zielgruppe | Personalisierbar? |
|---|---|---|---|
| W-01 „Mein Campus“ | Schulname, freigegebene schulische Basisdaten | Alle aktiven Benutzer | Nein: fester kompakter Bereich |
| W-02 „Mein Konto“ | Eigenes Profil, zugelassene eigene Statusinformationen | Alle aktiven Benutzer | Ja: Position, Sichtbarkeit, geeignete Größe |
| W-03 „Meine Zuordnungen“ | Tatsächlich eigene Kurse und Klassen-/Klassenleitungszuordnungen | Schüler und Lehrkräfte, nach Objektberechtigung | Ja |
| W-04 „Verwaltung“ | Zulässige Verwaltungsaktionen sowie minimale aggregierte Foundation-Kennzahlen | Nur berechtigtes Sekretariat, Schulleitung, Schuladmins bzw. andere explizit Berechtigte | Ja |
| W-05 „Module“ | Tatsächlich verfügbare Foundation-Basisfunktionen/Module, keine als aktiv getarnten späteren Fachmodule | Berechtigte Benutzer, soweit sinnvoll | Ja |
| W-06 „Sicherheitshinweis“ | Tatsächlich relevante Konto- oder Sicherheitszustände | Betroffene Konten | Nein, solange Anlass besteht |

„Personalisierbar“ bezieht sich nur auf **bereits automatisch verfügbare** optionale Widgets. W-05 ist kein Menü zum Nachladen beliebiger Widget-Typen. Kein Benutzer kann sich ein neues Recht durch Einblenden, manuelle API-Parameter oder Rollenfokus verschaffen.

### 6.3 Rollenbezogene Standard-Schwerpunkte

| Rolle | Vorrangige Anzeige in Foundation | Grenzen |
|---|---|---|
| Schüler | W-03 mit eigener Klasse und eigenen Kursen; W-02 eigenes Konto; W-01 | Keine fremden Personen, keine Noten/Aufgaben/Stundenpläne |
| Lehrkraft | W-03 eigene Kurse/Klassenleitungen; geschützter Einstieg in Schüler-Passwortreset; W-02 | Nur aktive Lehrer und Schüler derselben Schule; kein Einsehen oder Setzen von Schülerpasswörtern durch Lehrkräfte |
| Eltern | W-01, W-02, tatsächlich zugängliche Einstellungen/Schulbasisdaten | Keine Kinderdaten/Eltern-Kind-Verknüpfung in v0.1 |
| Sekretariat | W-04 für explizit erteilte Mitglieds-/Einladungs-/Schulverwaltungsrechte | Kein pauschales Schulverzeichnis-/Administrationsrecht |
| Schulleitung | W-04 mit autorisierten Verwaltungsaktionen und minimierten organisatorischen Kennzahlen | Kein Zugriff auf sensible Unterrichtsinhalte ohne eigenes Recht |
| Schuladmin | W-04 mit zulässigem Account-/Einladungs-/Modulverwaltungsstatus | Kein Betreiberzugang und keine pauschalen sensiblen Fachdaten |

### 6.4 Rollenansicht bei mehreren Rollen

- Nur tatsächlich **aktive**, innerhalb derselben Schule zugewiesene Rollen dürfen in der Auswahl erscheinen; die Anzeige darf von Zusatzrechten abhängige Widgets nur bei wirksamer Autorisierung enthalten.
- Wechsel der Rollenansicht steuert Priorität/Sichtbarkeit des **Layouts**. Die effektive Rollenunion, der Zustand der Mitgliedschaft, Objektregeln, RLS-Policies und Zugriffsverbote bleiben **unverändert**.
- Die anderen berechtigten Navigationsziele bleiben unabhängig vom ausgewählten Dashboard-Fokus erreichbar.
- Keine eigene Campus-Tab-Leiste; stattdessen beschriftete Auswahl (z. B. Select/Dropdown). Kein Schulwechsel oder neuer Auth-Kontext.
- Bei Rollenentzug, Sperre, Berechtigungsänderung oder Fehlzustand neu autorisieren und nicht mehr zulässige Inhalte aus der sichtbaren Ansicht/geschützten Caches entfernen.
- Die **Persistenz der bevorzugten Rollenansicht** ist noch **offene Frage 12.8**. Nicht automatisch mit der bereits beschlossenen Persistenz von Widget-Präferenzen gleichsetzen.

### 6.5 Personalisierung des automatisch bereitgestellten Layouts

- Standardansichten sind sinnvolle **Rollenvorlagen**. Die Widget-Typen werden systemseitig bereitgestellt; in Foundation existiert kein frei durchsuchbarer Widget-Katalog zum Hinzufügen beliebiger Typen.
- Bereits verfügbare optionale Widgets können per gut beschrifteten Aktionen aufwärts/abwärts verschoben, aus-/eingeblendet und bei Eignung zwischen `small`/`large` geändert werden.
- „Standard wiederherstellen“ stellt eine **aktuell zulässige** Rollenvorlage her; W-01 und aktive W-06 bleiben immer sichtbar.
- Touch, Tastatur und Screenreader haben eine gleichwertige Bedienung. Drag-and-drop ist optional, keine Voraussetzung.
- Harmlose Widget-Präferenzen werden pro schulgebundenem Konto gespeichert; lokal wirksame Änderungen und bestätigte Serverpersistenz sind unterscheidbar. Fehler haben verständliche Rückmeldung und sicheren Wiederhol-/Rücksetzweg.
- Sichtbarkeits- oder Größenwünsche dürfen serverseitige Rechteprüfung niemals ersetzen.

### 6.6 Zustände und sichere Interaktionen

- **Leer:** Kompakte Information ohne Fake-Daten; hilfreiche Handlungsoption nur bei tatsächlichem Recht und funktionsfähiger Route. Kein erfundener Stundenplan/Eintrag.
- **Lädt/Fehler/Offline:** Unterscheidbare Zustände, Wiederholen bei plausibler Möglichkeit; keine sensitive Datenanzeige aus fremdem Kontext.
- **Aktionslinks:** Navigation nur zu real vorhandenen, geschützten Foundation-Routen; Lehrer-Passwortreset nur nach den Auth-/Recovery-Gates und Identity-Prüfverfahren aktiv anbieten.
- **Sicherheitsmeldungen:** Aus tatsächlichen Konto-/Sicherheitszuständen, nicht pauschal aus werblichen oder hypothetischen Hinweisen. Nicht ausblendbar bei Relevanz.
- **Session/Role-Freshness:** Geschützte UI-Daten bei Logout, Suspendierung, Rechteentzug, Schulkontext-Fehlern und Tokenwechsel invalidieren; keine ausschließlich clientseitige Autorisierung.

### 6.7 Nicht implementierte Fachmodule

Keine produktiven Dashboard-Widgets für Stundenplan, Aufgaben, Messenger, Noten, Klassenbuch, Kalender, Push oder Eltern-Kind-Ansichten in Foundation v0.1. Spätere Fachmodule können erst mit realen Berechtigungen und Datenquellen ergänzt werden. Eine optional klar gekennzeichnete nicht-funktionale Vorschau darf nicht als aktive Funktion erscheinen.

## 7. Flows (beispielhafte fachliche Abläufe)

### FL-01 Login
1. Benutzer öffnet `schule.campus.example` (Beispieldomain).
2. Hosting löst die Schule anhand vertrauenswürdiger Serverkonfiguration auf.
3. Loginformular zeigt schulische, öffentlich freigegebene Metadaten.
4. Benutzer meldet sich mit Benutzername/Passwort an.
5. Auth-Gateway/Supabase Auth prüfen Identität; Mandantenzuordnung wird serverseitig nachgeprüft.
6. Erfolgreiche Anmeldung → Dashboard; Fehler → neutrale Fehlermeldung ohne Benutzerenumeration.
**Gate:** Technische Validierung von Benutzername-Login ohne echte E-Mail erforderlich.

### FL-02 Rollenabhängige Navigation
1. Session wird geprüft.
2. Zulässige Navigationsziele aus wirksamen Rechten abgeleitet.
3. Adminbereich erscheint bei vorhandener Berechtigung.
4. Direkter Aufruf eines unberechtigten Pfades → Zugriff verweigert; keine Datenabfrage mit Umgehung der RLS.

### FL-03 Dashboard personalisieren
1. Benutzer öffnet „Dashboard anpassen“.
2. Optionales Widget ausblenden oder per zugänglichen Verschiebefunktionen umsortieren.
3. Pflichtwidget kann nicht deaktiviert werden.
4. Vorschau sofort aktualisieren; Änderungen werden gespeichert, Fehler rollback/Feedback.

### FL-04 Einladung und CSV-Import
1. Berechtigter Nutzer öffnet Mitgliederverwaltung.
2. Einzelne Einladung oder CSV-Import auswählen.
3. Upload → lokale/serversichere Vorschau, Validierung, Dublettenhinweise.
4. Rechte und Schulkontext serverseitig prüfen.
5. Explizite Bestätigung; Ergebnisse einschließlich Fehlerzeilen darstellen.
6. Kein Passwortimport, keine schulübergreifende Benutzerverknüpfung.

### FL-05 Rechteänderung
1. Berechtigter Admin wählt Zielmitglied und zulässiges Recht.
2. UI prüft Plausibilität; serverseitig gelten vollständige Regeln.
3. Pflichtbegründung eingeben; Warnung bei hochprivilegierter Änderung.
4. Transaktionsgesicherte Änderung samt Audit.
5. Erfolg erst bei bestätigter Persistenz. Niemals die letzten Schuladminrechte regulär entfernen.

### FL-06 Passwortreset durch Lehrkraft
1. Aktive Lehrkraft wählt Schüler derselben Schule.
2. Identität anhand geregelter schulischer Vorgehensweise prüfen.
3. Reset-Nachweis ausstellen; Lehrkraft sieht kein neues/aktuelles Passwort.
4. Schüler setzt Passwort selbst; Ereignis wird auditiert.
5. Gültigkeit, Rate Limits und bestehende Sessions beachten.

## 8. UI-Komponenten (Foundation)

- `AppShell`, `Sidebar`, `BottomNavigation`, `MoreMenu`, `TopBar`, `PageHeader`, `Breadcrumbs` (Web optional).
- `Button`, `IconButton`, `TextField`, `PasswordField`, `Select`, `Checkbox`, `Dialog`, `Sheet`, `Card`, `Badge` (nur echte Statussemantik). Keine Campus-internen Tabs.
- `DataList`, `ResponsiveTable`, `EmptyState`, `ErrorState`, `LoadingState`, `ConfirmDialog`, `Toast`/InlineFeedback.
- `PermissionGate` nur für Sichtbarkeit/UX – **kein Ersatz für RLS**.
- `DashboardWidget`, `WidgetEditControls`, `ThemeToggle`.
- Für Listen/Tabelle: Suchfeld, Filter, Sortierung, Pagination beziehungsweise Virtualisierung erst bei messbarem Bedarf.
- Destruktive Aktionen: eindeutige Beschriftung und Bestätigung; niemals nur Icons ohne zugänglichen Namen.

## 9. Accessibility und Sicherheit im UI

- WCAG 2.2 AA als Ziel; automatisierte Checks + manuelle Tastatur-, Screenreader- und Touch-Tests.
- Lesbarer Kontrast (Text mindestens 4,5:1, großer Text 3:1, relevante UI-Grenzen 3:1, soweit WCAG anwendbar).
- Sichtbarer Fokus; logische Tab-Reihenfolge; keine Keyboard-Traps; dialogischer Fokus korrekt verwalten.
- Touch-Ziele mindestens WCAG-2.2-AA-konform gestalten; größere Ziele bevorzugen.
- Statusänderungen für Assistive Technologien ansagen; Formularfehler am Feld plus Zusammenfassung.
- Kein PII in Routenparametern, Toasts, Crash-Logs oder Analytik ohne Freigabe.
- Nur minimierte Profildaten im UI; keine automatische Einsicht in fremde Benutzerprofile.
- Bei Logout, Sperrung oder Konto-/Rechtewechsel zwischengespeicherte geschützte Daten entfernen bzw. invalidieren.
- Auch bei kopierter URL oder manipuliertem Client darf kein unerlaubter Datenzugriff möglich sein.

## 10. Explizit NICHT Foundation v0.1

**Keine funktionalen Screens/Workflows** für Stundenplan, Vertretungsplan, Messenger, Hausaufgaben, Abgaben, Noten, Klassenbuch, Anwesenheitsverwaltung, Kalender, Eltern-Kind-Datenfreigabe, Unterrichtsdateien, Mensa, Ganztag, Ressourcenbuchung, Push, KI, SSO, Abrechnung oder Integrationen. Keine Fake-Inhalte als echte Daten. Keine schulübergreifenden Kontowechsel- oder Administrationsscreens.

Erlaubt: klar markierte, nicht irreführende Vorschau-/„Später verfügbar“-Karten ohne produktive Aktion. Für Eltern nur Basis-Dashboard ohne Kinderzugriff.

## 11. Implementierungsreihenfolge und Tickets

| Ticket | Priorität | Lieferung |
|---|---|---|
| UX-01 | P0 | Tokens + ThemeProvider + Core-Komponenten + UI-Zustände |
| UX-02 | P0 | Adaptive App Shell: Sidebar, Bottom Nav, More Menu |
| UX-03 | P0 | Auth-Screens und geschützte Routen (Auth-Gate beachten) |
| UX-04 | P0 | Dashboard-Basis und rollenabhängige Navigation |
| UX-05 | P1 | Widget-Layout, Umordnung, Ausblenden, verpflichtende Widgets |
| UX-06 | P1 | Profil, Theme und E-Mail-Einstellungen |
| UX-07 | P1 | Admin: Mitglieder, Einladungen, CSV-Import, Rechteänderungen |
| UX-08 | P1 | Admin: Schuljahre, Klassen, Fächer, Kurse, Module |
| UX-09 | P0 | Permission-/Error-/Loading-/Empty-/Offline-States |
| UX-10 | P0 | Accessibility + responsive + Rollen-E2E + visuelle QA |

## 12. Prüffälle / Definition of Done

| Test-ID | Erwartung |
|---|---|
| UX-T01 | Desktop-Seitenleiste ist ein-/ausklappbar; Zustand wird lokal wiederhergestellt. |
| UX-T02 | Mobil sind Bottom Navigation und Mehr-Menü mit Tastatur/Screenreader bedienbar. |
| UX-T03 | Tablet wechselt ohne abgeschnittene Inhalte zwischen Navigations- und Gridvarianten. |
| UX-T04 | Alle Rollen verwenden dieselbe Shell, aber sehen nur erlaubte Ziele und Daten. |
| UX-T05 | Direkter unberechtigter Admin-Routenaufruf zeigt Zugriff verweigert; API verweigert auch. |
| UX-T06 | Pflichtelemente des Dashboards lassen sich nicht ausblenden. |
| UX-T07 | Optionale Widgets lassen sich zugänglich sortieren und ausblenden; Persistenz funktioniert. |
| UX-T08 | System/Light/Dark funktionieren im Web und nativen Laufzeitumgebungen. |
| UX-T09 | Pflichtzustände loading/empty/error/forbidden/offline sind vorhanden. |
| UX-T10 | Kein späteres Schulmodul wirkt in Foundation funktionsfähig, wenn es das nicht ist. |
| UX-T11 | Benutzer einer Schule sehen keine Daten/Navigation anderer Schulen. |
| UX-T12 | CSV-, Rechte- und Reset-Flows zeigen nur nach serverseitiger Bestätigung Erfolg. |
| UX-T13 | Kernflows sind mit Tastatur und Screenreader nutzbar; Kontrastwerte dokumentiert. |
| UX-T14 | Login auf nicht bekannter/deaktivierter Subdomain gibt keine geschützten Inhalte preis. |

## 13. Offene Detailentscheidungen – nicht blockierend

1. Endgültige Domain und Branding (Subdomain im Dokument nur Beispiel).
2. Konkrete Breakpoints nach frühen Geräte- und Zoomtests.
3. Ob App-Tab „Schule“ auf kleinen Screens direkt sichtbar sein muss oder unter „Mehr“ wandert (hier als Vorschlag direkt sichtbar).
4. Exakte Pflichtnachrichten: Foundation hat noch kein Mitteilungsmodul. Nur technisch existierende Kontohinweise dürfen Pflichtstatus haben.
5. Finale Form der mobilen Admin-Tabellen (Listen-/Kartenvariante).
6. Ob Dashboard-Widget-Reihenfolge serverseitig zusätzlich zur lokalen Speicherung synchronisiert wird; Empfehlung: schulgebundene `user_preferences`.

**Externe Freigabesperren:** Auth-PoC, Subdomain-Hosting-PoC, Datenschutz-/Sicherheitsfreigabe vor Echtdaten.

## 14. Übergabe an Entwicklungsagent

1. Dieses Dokument mit `doc/DECISIONS.md`, `doc/ARCHITECTURE.md`, `doc/SECURITY_AUTH.md` und `doc/design.md` abgleichen.
2. Noch kein umfangreiches visuelles Redesign des bestehenden Campus Purple.
3. Screens über wiederverwendbare Komponenten umsetzen; keine rollenweise kopierten App-Shells.
4. Jede Funktion mit Test-ID referenzieren; nicht vorhandene Fachmodule ausdrücklich abgrenzen.
5. Bei Widersprüchen Entscheidung dokumentieren, nicht stillschweigend umdeuten.
6. UI-Routenschutz ersetzt keine serverseitige Autorisierung.

**Abnahme:** Freigabe durch Produkteigentümer nach Prüfung der Entscheidungen, Kernflows, Rollenansichten und Accessibility. Technische Realisierbarkeit der offenen Auth-/Hosting-Gates ist gesondert nachzuweisen.


---

## 16. Verbindliche Ergänzung: Entscheidungsrunde 10 (13.10.2026)

Die folgenden Produktentscheidungen sind **verbindlich** und ergänzen UX-DEC-01 bis UX-DEC-06. Diese Ergänzung ist Bestandteil der Implementierungsvorgaben. Bei Konflikten mit früheren *Vorschlägen* in diesem Dokument gelten UX-DEC-07 bis UX-DEC-14.

| ID | Verbindliche Entscheidung |
|---|---|
| UX-DEC-07 | Eine zentrale Suche in der globalen Topbar; Ergebnisse strikt entsprechend den aktuellen Berechtigungen. |
| UX-DEC-08 | Desktop verwendet reguläre Browser-Tabs; keine zusätzlichen Campus-internen Tabs. |
| UX-DEC-09 | Kleine Aktionen in zugänglichen Dialogen, umfangreiche Verwaltungsformulare auf eigenen Seiten. |
| UX-DEC-10 | Desktop: Tabellen mit Suche, Filtern und Sortierung. Smartphone: adaptive Kartenlisten. |
| UX-DEC-11 | Einfache, reversible Einstellungen automatisch speichern; wichtige fachliche oder sicherheitskritische Änderungen nur nach explizitem Speichern/Bestätigen. |
| UX-DEC-12 | Nach Aktionen kurze zugängliche Statusmeldung und sichtbare Aktualisierung der betroffenen Daten. |
| UX-DEC-13 | Dashboard-Widgets in kleinen und großen Größen innerhalb eines definierten Rasters; umsortierbar, soweit zulässig, optionale Widgets ausblendbar. |
| UX-DEC-14 | Smartphone: wichtige Aktionen direkt sichtbar, seltene Aktionen im beschrifteten Drei-Punkte-Kontextmenü; keine ausschließlich gestenbasierte Bedienung. |

### 16.1 Globale Suche – Datenzugriff und Interaktion

**Zielzustand:** Ein zentraler, eindeutig beschrifteter Sucheinstieg im oberen Shell-Bereich auf Web und als zugängliche Suchaktion in der mobilen Shell. Benutzer suchen ausschließlich Daten, auf die sie tatsächlich zugreifen dürfen. Der Suchbegriff ist keine Berechtigung.

- **Foundation v0.1:** Suche nach *berechtigten* Mitgliedern (nur Rollen mit zulässigem Verzeichnis-/Verwaltungszugriff), Klassen, Fächern und Kursen. Nicht berechtigten Rollen werden keine sensiblen Verzeichnisse oder Suchtreffer angeboten. Ein Schüler darf nicht dadurch auf ein Schülerverzeichnis zugreifen, dass die Suche global positioniert ist. Ergebnisart, Titel und erlaubter Kontext werden angezeigt; keine geheimen Profil- oder Kontodetails in Snippets.
- Suchfeld erhält Label, Clear-Aktion, Tastaturbedienbarkeit, Lade-, Leer-, Fehler- und Keine-Berechtigung-Zustände. Suchergebnisse verlinken nur auf real implementierte und berechtigte Foundation-Routen.
- Der Server setzt Schulkontext, Mitgliedschaftsstatus, Rollen-/Objektrechte, RLS, sichere Parameter und begrenzte Ergebnismengen durch. Keine clientseitige Filterung als alleinige Sicherheitsbarriere. Suchanfragen dürfen nicht in Audit/Analytics mit personenbezogenen Eingaben unkontrolliert protokolliert werden.
- **Später:** modulübergreifender Suchindex und Suchergebnisse für Stundenplan, Nachrichten, Aufgaben, Dateien etc. Keine Indizierung solcher Fachmodule in v0.1.
- Wenn das Auth-Gate noch aussteht, darf ein visuelles Suchfeld ohne echte Datenfunktion nur explizit als nicht verfügbar markiert werden; keine simulierten Suchergebnisse als fertiges Feature ausgeben.

### 16.2 Browser-Tabs und Navigation

- Keine eigene Tab-Leiste innerhalb der Campus-Anwendung; Standard-Browsernavigation, Back/Forward und Öffnen in neuem Tab sollen funktionieren.
- Zuständige Web-Routen sind direkt adressierbar und refresh-sicher, sofern authentifiziert und autorisiert. Keine schulspezifischen oder persönlichen Geheimnisse in URLs.
- Mobile Navigation bleibt gemäß Runde 9: Bottom Navigation + Mehr. Normale In-App-Navigation darf nicht künstlich durch Desktop-Tabs ersetzt werden.

### 16.3 Dialog versus Seite

- **Dialog:** kurze, begrenzte Aktion (beispielsweise Bestätigung, Umbenennen mit einem Feld, einfache Filteroption). Fokusführung, Escape/Schließen, Screenreader-Titel, Fehlertexte und sichere Zurückhaltung bei destruktiven Aktionen.
- **Eigene Seite:** Benutzeranlage, Einladung mit Rollen, CSV-Import samt Vorschau, umfangreiche Rollenvergabe, Schuljahres-/Kursbearbeitung mit mehreren Feldern.
- Kritische Rechteänderungen erfordern immer explizite Bestätigung, berechtigungsgeprüfte Serveroperation, bei Bedarf Pflichtbegründung und transaktionales Audit. Ein Dialog allein ist keine Sicherheitskontrolle.
- Bei ungespeicherten wichtigen Änderungen Warnung beim internen Seitenwechsel und im Web soweit zuverlässig möglich beim Verlassen; niemals Daten stillschweigend verwerfen.

### 16.4 Tabellen, Filter und mobile Karten

- Desktop-Tabellen für Mitglieder, Einladungen, Schuljahre, Klassen, Fächer, Kurse und soweit autorisiert Audit-Ereignisse. Spalten entsprechend dem Datenschutz-Minimum, klar beschriftete Sortierfunktionen, zugängliche Filter, Lade-/Leer-/Fehlerzustände, Pagination beziehungsweise serverseitige Begrenzung.
- Mobil: ein Datensatz pro Karte mit primären Informationen und sichtbarer Hauptaktion; sekundäre Aktionen im Drei-Punkte-Menü. Wichtige Statusinformationen dürfen nicht ausschließlich über Farben vermittelt werden.
- Such- und Filterzustände sollen beim Wechsel zwischen Listen- und Detailansicht sinnvoll erhalten bleiben; keine vollständigen personenbezogenen Datenlisten nur zur clientseitigen Filterung laden.
- Keine Tabellenansicht erzwingen, die auf schmalen Bildschirmen nur durch horizontales Scrollen bedienbar ist.

### 16.5 Speichern, Feedback und Ausfallszenarien

- **Autosave nur für einfache Präferenzen:** Theme, Sidebar-Einklappzustand und harmlose Dashboard-Präferenzen. Änderungen sofort lokal zeigen; Server-Persistenz (wo relevant) mit Fehlerindikator und retry/rollback bei Fehlschlag. Keine Annahme, dass ein lokaler Wert bereits auf dem Server gespeichert wurde.
- **Explizite Speicherung:** Profil-Kontaktdaten, Benutzernamen, Einladungen, Klassen/Kurse, Rollen, Rechte, Benutzer-Suspendierung, CSV-Import und jede sicherheitsrelevante Aktion.
- Rückmeldungen: nicht-blockierende Statusmeldung („Gespeichert“, „Änderung fehlgeschlagen“) und aktualisierter Datensatz. Erfolgsmeldungen erst nach erfolgreicher Serverantwort. Fehlermeldungen nennen verständliche Handlungsoptionen, aber keine internen Schlüssel oder fremden Identitäten.
- Für irreversible oder weitreichende Folgen sind gegebenenfalls Bestätigungsdialoge erforderlich; **nicht** jede normale Aktion braucht einen Dialog.
- Statusmeldungen sind für Screenreader ankündigbar und verschwinden nicht so schnell, dass sie unlesbar sind.

### 16.6 Dashboard-Raster und Personalisierung

- Ein gemeinsames rollenabhängiges Dashboard; Widgets nur aus erlaubten Ressourcen zusammenstellen. Rollenunion hebt keine Objektgrenzen auf.
- **Foundation:** ein kleines, responsives Raster mit mindestens zwei unterstützten Größen (`small`, `large`), vordefinierten Widgets für schul- und profilbezogene Basisinformationen; Reihenfolge und Sichtbarkeit optionaler Widgets speichern. Pflicht-/Sicherheitsinformationen bleiben fix sichtbar.
- Personalisierung per zugänglicher Bedienung („Nach oben/unten verschieben“, „Größe wählen“), nicht nur Drag-and-drop. Falls Drag-and-drop angeboten wird, muss eine gleichwertige Tastaturalternative existieren.
- Ungültige oder nicht länger berechtigte Widgets werden beim Laden aus dem sichtbaren Layout ausgeschlossen; personalisierte Layoutdaten sind nie Autorisierungsgrundlage.
- **Später:** frei kombinierbare Fachmodule-Widgets und komplexe Widgetbibliothek. Kein uneingeschränktes Drag-and-drop-Layout in Foundation.

### 16.7 Abnahmefälle für Runde 10

| ID | Test / erwartetes Verhalten |
|---|---|
| UX10-T01 | Globale Suche zeigt für zwei fiktive Schulen niemals Treffer der anderen Schule. |
| UX10-T02 | Schüler ohne Verzeichnisrecht erhalten keine privaten Benutzer-Suchtreffer, auch nicht bei direktem API-Aufruf. |
| UX10-T03 | Suchergebnis navigiert auf eine autorisierte, direkt ladbare Route; fremde oder unautorisierte Route wird abgewiesen. |
| UX10-T04 | Desktop-Listen haben Suche, Filter und Sortierung; mobil dieselben Daten als zugängliche Karten. |
| UX10-T05 | Kleine Aktion verwendet Dialog mit korrekter Fokusbehandlung; umfangreiches Formular eigene Route. |
| UX10-T06 | Theme/Sidebar wird ohne expliziten Speichern-Klick persistiert; Fehlerzustand bei gescheiterter Persistenz. |
| UX10-T07 | Kritische Datenänderung erfolgt nie stillschweigend per Autosave; Fehler/Abbruch bewahrt bisherigen Stand. |
| UX10-T08 | Nach bestätigtem Speichern sichtbarer aktualisierter Zustand und Screenreader-taugliche Meldung. |
| UX10-T09 | Dashboard-Raster unterstützt kleine/große Widgets; Pflicht-Widgets lassen sich nicht ausblenden. |
| UX10-T10 | Widget-Reihenfolge/Größe per Tastatur oder zugänglicher Alternativbedienung veränderbar. |
| UX10-T11 | Seltene Mobilaktionen sind im Drei-Punkte-Menü erreichbar; Hauptaktionen bleiben sichtbar. |
| UX10-T12 | Web-Back/Forward, Refresh und reguläre Browser-Tabs funktionieren; kein internes Tab-System. |

### 16.8 Übergabegrenze / Abhängigkeiten

1. App-Shell, responsive Listen-/Dialog-/Status-Komponenten und lokales Präferenzverhalten können unabhängig vom Auth-PoC aufgebaut werden.
2. Echte globale Suchergebnisse, echte rollenabhängige Widgets und geschützte Verwaltungsformulare benötigen bestandenen Auth-PoC, finale schulgebundene Identität und geprüfte RLS-/IAM-Regeln.
3. Keine privilegierten APIs mit `service_role`-Schlüsseln im Expo-Bundle. Keine Scheindaten als produktive Daten ausgeben.
4. Die oben genannten Entscheidungen ergänzen das verbindliche Entscheidungsregister; zu übernehmen in `doc/DECISIONS.md` als UX-DEC-07 bis UX-DEC-14 mit Verweis auf dieses Dokument.


## 17. Verbindlicher Nachtrag: Entscheidungsrunde 11 (13.10.2026)

Die zwölf Entscheidungen UX-DEC-15 bis UX-DEC-26 wurden vom Produkteigentümer bestätigt. Sie konkretisieren den Dashboardbereich und bilden die **aktuelle verbindliche Grundlage** für Abschnitt 6. Frühere UI/UX-Beschlüsse, insbesondere UX-DEC-01 bis UX-DEC-14, bleiben erhalten.

| ID | Wahl | Entscheidung |
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


### 17.1 Geltung und Konfliktlösung

- UX-DEC-17: **kein manuelles Hinzufügen frei wählbarer Widget-Typen** in Foundation.
- UX-DEC-25 sowie UX-DEC-04/13: **ja zur Anpassung vorhandener optionaler Widgets** (Reihenfolge, Sichtbarkeit, unterstützte Größe, Rücksetzung). Beides ist gemeinsam bindend.
- UX-DEC-24: Rollenansicht ist ein **rein visueller Schwerpunkt**, während wirksame Berechtigungen mehrerer Rollen weiterhin vereinigt werden. Keine Sicherheitsumschaltung, kein Multi-School-Account, keine interne Tab-Navigation.
- Frühere Formulierungen „Seitentitel und Begrüßung zuerst“ sind in ihrem **Layoutvorschlagsanteil** verdrängt: Das Dashboard beginnt unmittelbar mit kompaktem W-01 und Widgets.
- „Rollenansicht zuletzt speichern“ (Frage 12.8) und die exakte künftige Informationsarchitektur aus Runde 12 sind **noch nicht beschlossen**. Keine stillschweigende Festlegung in v1.2.
- Für Authentifizierung, Datenschutz und Mandantenidentität bleiben `doc/DECISIONS.md`, `doc/ARCHITECTURE.md`, `doc/SECURITY_AUTH.md` vorrangig.

### 17.2 Runde-11-Abnahmekriterien (Soll-Zustand; keine behaupteten Testergebnisse)

| Test-ID | Erwartung |
|---|---|
| UX11-T01 | Das Dashboard beginnt ohne großen Hero-Bereich; „Mein Campus“ ist kompakt, sichtbar und nicht ausblendbar. |
| UX11-T02 | Ein tatsächlicher Sicherheitshinweis erscheint separat und lässt sich nicht ausblenden; ohne Anlass erscheint keine Fake-Warnung. |
| UX11-T03 | Widgets werden automatisch rollen-/berechtigungsabhängig angeboten; kein allgemeiner Hinzufügen-Katalog in v0.1. |
| UX11-T04 | Ein Schüler sieht ausschließlich eigene Klassen-/Kurszuordnungen, keine fremden und keine spätere Fachmoduldaten. |
| UX11-T05 | Eine aktive Lehrkraft sieht eigene Zuordnungen und einen nur bei vollständiger Freigabe funktionsfähigen Schüler-Reset-Einstieg; fremde Schule/Erwachsene werden auch API-seitig abgelehnt. |
| UX11-T06 | Eltern erhalten weder Kinderansicht noch nicht freigegebene Kinder-/Leistungsdaten. |
| UX11-T07 | Sekretariatskacheln und -aktionen sind auf tatsächlich delegierte Berechtigungen begrenzt. |
| UX11-T08 | Schulleitung erhält nur freigegebene Verwaltungs-Metadaten und zulässige Aktionen. |
| UX11-T09 | Schuladmin erhält autorisierte Konten-/Einladungs-/Modulinfos ohne allgemeine private Unterrichtsdaten. |
| UX11-T10 | Rollenansicht bei Mehrfachrolle verändert Layoutfokus, nicht Rolle, Serverrechte, RLS oder zugängliche Navigationsziele. |
| UX11-T11 | Rollenentzug oder Suspendierung entfernt nicht mehr autorisierte Daten auch aus angezeigten Widgets/geschütztem Cache. |
| UX11-T12 | Optionale verfügbare Widgets können mit Tastatur und Screenreader sortiert/ausgeblendet und bei Eignung zwischen small/large gewechselt werden. |
| UX11-T13 | Zurücksetzen stellt nur zulässige Rollenvorlagen wieder her, W-01 und relevantem W-06 kann nicht die Sichtbarkeit entzogen werden. |
| UX11-T14 | Widget-Präferenzen werden je schulgebundenem Konto isoliert; Lade-/Speicherfehler werden deutlich kommuniziert. |
| UX11-T15 | Leere, ladende, Offline-, verbotene und Fehlerzustände sind unterscheidbar, ohne echte Daten zu erfinden. |
| UX11-T16 | iOS, Android und Web behalten zugängliche und responsive Dashboardlayouts; keine exklusiv drag-basierte Bedienung. |

### 17.3 Umsetzungssperren und Status

Dieser Nachtrag ist **Planung**, keine Aussage, dass die Funktionen bereits implementiert oder getestet sind. Datenanbindung und sicherheitsrelevante Aktionen benötigen die Gate-Freigaben für Authentifizierung, Mandantentrennung/IAM und RLS. Solange diese fehlen, dürfen Komponenten gebaut werden; echte Kontozugriffe, Lehrerreset, Verwaltungskennzahlen und rollenbezogene Suche sind als **BLOCKIERT** zu behandeln, nicht als „bestanden“ oder simuliert funktionsfähig.
