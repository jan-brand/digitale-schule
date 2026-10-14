# Claude Code – Campus UI/UX-Runde 10: gezielter Implementierungsauftrag

Du arbeitest im Terminal direkt im lokalen Repository `digitale-schule`. Dieser Auftrag ergänzt die verbindlichen Campus-Entscheidungen und konkretisiert die UI/UX-Entscheidungsrunde 10. **Setze ausschließlich den Foundation-v0.1-Umfang um.** Keine vollständigen späteren Fachmodule.

## 1. Zuerst prüfen, nicht blind umbauen

1. Prüfe `pwd`, `git status`, Branch, offene Änderungen und tatsächlichen Dateistand.
2. Lies `doc/DECISIONS.md`, `doc/ARCHITECTURE.md`, `doc/IMPLEMENTATION_PLAN.md`, `doc/SECURITY_AUTH.md`, `doc/ACCEPTANCE.md`, `doc/design.md`.
3. Übernimm die beigefügte `doc/UI_UX_SPECIFICATION.md` (v1.1) nach inhaltlichem Abgleich mit schon vorhandener aktueller Spezifikation; erhalte bestehende Ergänzungen.
4. Ergänze das Entscheidungsregister um UX-DEC-07 bis UX-DEC-14; verweise auf die UI/UX-Spezifikation. Alte UX-Runde-9-Beschlüsse bleiben erhalten.
5. Arbeite auf einem Feature-Branch, niemals direkt auf `main`, und bewahre uncommittete Änderungen.
6. Dokumentiere, was bereits funktioniert, was nur Stub ist und welche Abhängigkeiten zur Auth-/IAM-Freigabe bestehen.

## 2. Verbindliche UX-Entscheidungen

- **UX-DEC-07:** Zentrale globale Suche oben; ausschließlich berechtigte schulgebundene Ergebnisse.
- **UX-DEC-08:** Browser-Tabs und Standardnavigation; keine Campus-internen Tabs.
- **UX-DEC-09:** Kurze Aktionen im Dialog, umfangreiche Formulare als eigene Route.
- **UX-DEC-10:** Desktop-Tabellen mit Suche/Filter/Sortierung; Mobilansicht als Kartenliste.
- **UX-DEC-11:** Autosave bei einfachen Einstellungen; explizites Speichern bei wichtigen Daten.
- **UX-DEC-12:** Zugängliche kurze Statusmeldung plus sichtbare Aktualisierung nach Aktionen.
- **UX-DEC-13:** Dashboard-Widgets `small`/`large` im Raster, Reihenfolge/Sichtbarkeit kontrollierbar.
- **UX-DEC-14:** Mobile Hauptaktionen direkt sichtbar; Nebenaktionen im beschrifteten Drei-Punkte-Menü.

Beibehalten: einklappbare Desktop-Sidebar, Bottom-Navigation plus „Mehr“ mobil, adaptive Tablets, rollenabhängiges Grunddashboard, integrierte berechtigungsabhängige Administration, Campus Purple und WCAG-2.2-AA-Ziel.

## 3. Konkret in Foundation v0.1 entwickeln

### UX10-F01 – App Shell und Navigation
- Auf Desktop linke einklappbare Sidebar mit erreichbaren Fokuszuständen und gespeichertem Einklappzustand.
- Auf Smartphone Bottom-Navigation plus Mehr-Menü; auf Tablet adaptives Layout.
- Globale Topbar mit Schulkontext und Sucheinstieg. Solange Auth/IAM nicht bereit sind: Suche funktional zurückhalten, klar und ehrlich als nicht verfügbar kennzeichnen; keine künstlichen Treffer.
- Routen für Foundation-Funktionen nach Berechtigung; kein Schulwechsler, kein internes Tab-System.
- Browser Back/Forward, direkter Routenaufruf und Refresh erhalten.

### UX10-F02 – Komponenten
- Wiederverwendbare `ResponsiveDataList` beziehungsweise `DataTable`/`DataCard` mit Loading/Empty/Error, Suchfeld, Filtern, Sortierung und begrenzter Ergebnisanzahl.
- Zugängliche `ConfirmDialog`/`ActionDialog` für kurze Aktionen und `FormPage` für größere Vorgänge.
- `ActionMenu` (Drei-Punkte-Menü) für mobil seltene Aktionen. Wichtigste Aktion pro Karte sichtbar.
- `StatusMessage`/Toast mit Screenreader-Ansage und aktualisierter Ansicht. Erfolg erst nach tatsächlicher erfolgreicher Operation.
- Einheitliche Formvalidierung, Abbrechen und Schutz vor unbemerktem Verlust ungespeicherter Änderungen bei wichtigen Formularen.
- Vorhandene UI-Bausteine wiederverwenden und nicht mehrfach neu implementieren.

### UX10-F03 – Speichern
- Theme und Sidebar-Einklappzustand automatisch persistent speichern.
- Wenn das fachliche Dashboard-Widget-Layout bereit ist, dessen harmlose Präferenzen automatisch speichern; fehlgeschlagene Speicherung als Fehler anzeigen.
- **Keine** automatische Speicherung für Benutzernamen, E-Mail-Kontaktangaben, Benutzer-/Rollen-/Rechteverwaltung, Einladungen, CSV-Import, Schuljahre, Klassen oder Kurse.
- Bei kritischen Aktionen: explizite Bestätigung, serverseitige Autorisierung, gegebenenfalls Pflichtbegründung und Audit.

### UX10-F04 – Dashboard-Raster
- Einheitliches responsives Raster mit `small` und `large`; minimaler sinnvoller Satz von Foundation-Widgets.
- Rollen-/Objektberechtigungen serverseitig wahren. Keine fremden Daten aus unsicheren Beispieldatensätzen.
- Optionale Widgets ausblendbar und sortierbar; Pflicht- und Sicherheitshinweise nicht ausblendbar.
- Tastatur-/Screenreader-taugliche Alternative zu Drag-and-drop; freies komplexes Layout nicht erforderlich.
- Wenn echte Profildaten wegen Auth-Gate noch nicht zugänglich sind: Layout und Komponenten fertigstellen, echte Datenanbindung als blockiert markieren, keine falsche Fertigmeldung.

### UX10-F05 – Globale Suche (nur Foundation-Ressourcen)
- Sobald Auth, finales Identitätsmodell und RLS bestanden sind: Berechtigte Suche nach Mitgliedern (ausschließlich für Rollen mit Verzeichnisberechtigung), Klassen, Fächern und Kursen.
- Serverseitig Schule, aktive Mitgliedschaft, Berechtigungen und objektspezifischen Zugriff durchsetzen; kein vollständiges globales Personenverzeichnis als clientseitig gefilterte Liste.
- Suchergebnisse begrenzen, neutral bei nicht berechtigten Ergebnissen reagieren, Query/Fehlerdaten minimieren.
- Ergebnisse auf real vorhandene, geschützte Foundation-Routen verlinken.
- Vor erfüllten Gates nur nicht-sensitive UI-Hülle entwickeln und echte Suchfunktion als BLOCKIERT ausweisen.

### UX10-F06 – Verwaltungslisten
- Bestehende/fertige Foundation-Verwaltungsseiten für Mitglieder, Einladungen, Schuljahre, Klassen, Fächer und Kurse konsistent ausstatten.
- Desktop Tabelle, Smartphone Karte; keine unnötige horizontale Scrollpflicht.
- Filter und Sortierung auf dem Server umsetzen, soweit personenbezogene bzw. umfangreiche Daten betroffen sind.
- Keine ungeschützten Direktänderungen von IAM-Tabellen einbauen.

## 4. Ausdrücklich NICHT entwickeln

- Keine Campus-internen Desktop-Tabs.
- Keine Suche in Nachrichten, Aufgaben, Stundenplan, Noten, Dokumenten, Unterrichtsdateien oder sonstigen späteren Fachmodulen.
- Keine Suchmaschine mit externem Index, keine KI-Suche.
- Keine komplexe frei gestaltbare Widget-Bibliothek.
- Keine umfassende Benachrichtigungszentrale (Statusmeldungen sind erlaubt).
- Keine neue Identitäts-/Passwortarchitektur außerhalb des freigegebenen Auth-PoC.
- Keine Fachmodule aus der Foundation-Ausschlussliste (Messenger, Noten, Stundenplan, Klassenbuch usw.).
- Keine Verwendung von Service-Role/Secret Keys im Frontend.

## 5. Sicherheits- und Umsetzungsgates

**Wichtig:** Die GitHub-Überprüfung des früheren Branchstands hat Probleme beim öffentlichen Audit-Schreib-RPC, Principal-Entzug und veraltetem Multi-School-Identitätsmodell aufgezeigt. Diese Punkte sind nicht durch UI-Änderungen lösbar. Prüfe zuerst den aktuellen Stand und blockiere reale Administrations- und Suchdatenzugriffe bis zur Korrektur und zu bestandenem Auth-/RLS-Gate.

- Nicht behaupten, dass Benutzername-Login oder globale Suche funktioniert, solange Auth-/IAM-Gates nicht nachweisbar bestanden sind.
- Keine Datenbankmigrationen auf bestehender fremder/echter Instanz zurücksetzen.
- Führe die für deine Änderungen verfügbaren Unit-/UI-/Integrations-/Web-Build-Tests aus; dokumentiere, was nicht geprüft werden konnte.
- Keyboard-Fokus, Screenreader-Namen, Kontraste, Touch-Ziele und responsive Zustände testen.

## 6. Erwartete Tests und Abnahme

Setze UX10-T01 bis UX10-T12 aus Abschnitt 16.7 der UI/UX-Spezifikation um. Besonders:
- Fremdschul- und Fremdpersonen-Treffer bleiben unsichtbar und API-seitig verboten.
- Mobil Karten, Desktop Tabellen mit Filter und Sortierung.
- Eingabevalidierung, Dialogfokus und Warnung vor ungespeicherten kritischen Änderungen.
- Autosave nur für harmlose Präferenzen, sichtbares Fehlerfeedback.
- Zustandsrückmeldung erst nach bestätigtem Erfolg.
- Widget-Sortierung zugänglich, Pflichtinfos fest.
- Kein eigenes internes Tabsystem.

Wenn Auth, Suche und Rollenverwaltung noch nicht verfügbar sind, dokumentiere diese Tests als BLOCKIERT, nicht als BESTANDEN.

## 7. Lieferumfang / Arbeitsberichte

Arbeite in separaten logischen Commits bzw. Pull Requests:
1. Dokumentation und Entscheidungseintrag.
2. App Shell / UI-Komponenten.
3. Dashboard-Personalisierung und Einstellungsverhalten.
4. Berechtigungsgebundene Suche/Verwaltungslisten **erst nach Freigabe der Auth-/RLS-Gates**.
5. Tests und Abnahmebericht.

Nach jedem Paket nenne: geänderte Dateien, tatsächliche Features, Tests mit Ausführungsergebnis, bekannte Blockaden, nächste Aufgabe. Halte `doc/ACCEPTANCE.md` und `doc/IMPLEMENTATION_PLAN.md` entsprechend aktuell.

**Jetzt:** Beginne mit der Bestandsaufnahme und implementiere die von Auth/IAM unabhängigen UI-Grundlagen. Bearbeite noch keine späteren Fachmodule.
