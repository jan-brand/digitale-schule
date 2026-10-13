# Claude Code – Campus UI/UX-Runde 11: Design- und Entscheidungsdokumente übernehmen

**Ziel:** Die bereits vom Produkteigentümer beschlossene UI/UX-Runde 11 verbindlich und konsistent im bestehenden Campus-Repository dokumentieren. **Dies ist ein Dokumentations-/Planungsauftrag, ausdrücklich kein Auftrag zur Feature-Implementierung.** Runde 12 ist nicht freigegeben; keine neuen Produktentscheidungen treffen.

## 0. Eingaben und Zielordner

Arbeite im lokalen Git-Repository `digitale-schule`. Zur Übergabe liegen diese vier Dateien bei (relative Pfade aus dem ZIP):

1. `doc/DECISIONS.md` – konsolidiertes Entscheidungsregister mit UX-DEC-15 bis UX-DEC-26.
2. `doc/UI_UX_SPECIFICATION.md` – vollständige UI/UX-Spezifikation v1.2 auf Grundlage der zuvor beigefügten v1.1.
3. `doc/design.md` – bestehende Design-Tokens mit Runde-11-Designnachtrag.
4. `doc/UI_UX_DECISIONS_RUNDE_11.md` – eigenständiger fachlicher Entscheidungsnachtrag.

Die beigefügten Dateien wurden aus Planungsdokumenten abgeleitet. Sie spiegeln **nicht zwingend den neuesten Stand des Repositorys** wider. Nie blind über neuere vorhandene Texte kopieren.

## 1. Repository zuerst prüfen

1. Zeige `pwd`, `git status --short`, `git branch --show-current` und den aktuellen Commit.
2. Prüfe, ob lokale uncommittete Änderungen bestehen. Keine fremden Änderungen überschreiben, verwerfen oder committen.
3. Arbeite nur auf einem eigenen Feature-Branch, nie auf `main`. Wenn `main` aktiv ist, erst sicheren Branch für diesen Auftrag anlegen; bei Konflikten/ungeklärtem Workspace Zustand melden statt riskant zu agieren.
4. Lies aktuelle vorhandene Dateien: `doc/DECISIONS.md`, `doc/UI_UX_SPECIFICATION.md`, `doc/design.md`, `doc/ARCHITECTURE.md`, `doc/SECURITY_AUTH.md`, `doc/DATA_MODEL.md`, `doc/ACCEPTANCE.md`, `doc/IMPLEMENTATION_PLAN.md`, dazu relevante aktuelle ADRs. Lies auch ggf. vorhandene neuere UI/UX-Nachträge.
5. Erstelle einen kurzen Bestandsabgleich (Datei, bisheriger Stand, einzupflegende Neuerung, Konflikt, beabsichtigte Lösung). Falls der Stand bereits Runde 11 enthält, **keine doppelten Beschlüsse** einfügen.

## 2. Verbindliche Runde-11-Entscheidungen

- UX-DEC-15 (11.1 B): Dashboard zeigt sofort Widgets; Begrüßung/Schulkontext kompakt.
- UX-DEC-16 (11.2 A): „Mein Campus“ fixer kompakter Bereich, echte Sicherheitshinweise nur bei Anlass separat.
- UX-DEC-17 (11.3 B): Widgets automatisch durch Rolle/Rechte angeboten; keine freie Widget-Typenbibliothek in Foundation.
- UX-DEC-18 (11.4 A): Schüler – eigenes Konto, eigene Klasse und zugewiesene Kurse.
- UX-DEC-19 (11.5 A): Lehrkräfte – eigene Kurse/Klassenleitungen und geschützter Schüler-Passwortreset-Einstieg.
- UX-DEC-20 (11.6 A): Eltern – Schule/Konto/Einstellungen, keine Kinderansicht.
- UX-DEC-21 (11.7 A): Sekretariat – nur berechtigte Verwaltungskacheln/Einladungs- und Organisationsaktionen.
- UX-DEC-22 (11.8 A): Schulleitung – kompakte zulässige Verwaltungskennzahlen und Aktionen.
- UX-DEC-23 (11.9 A): Schuladmin – Konto/Einladungen/Module/Status, kein pauschaler Unterrichtsdatenzugriff.
- UX-DEC-24 (11.10 B): Bei mehreren Rollen wählbarer Dashboard-Rollenfokus; **keine Änderung der effektiven Rollenunion und Zugriffsrechte**.
- UX-DEC-25 (11.11 A): Rollenvorlagen, optionale bestehende Widgets sortieren, geeignet small/large, ausblenden/einblenden, Standard wiederherstellen.
- UX-DEC-26 (11.12 A): Verständliche Leerzustände und nur zulässige Aktionen, keine Fake-Live-Daten.

**Unbedingt beachten – scheinbarer Konflikt 11.3/11.11:** In Foundation gibt es **keine manuelle Widgetbibliothek zum Hinzufügen neuer Typen**, aber die **automatisch angebotenen optionalen Widgets** bleiben anpassbar. Die älteren UX-DEC-04 und UX-DEC-13 bleiben erhalten.

**Rollenansicht:** Nur Darstellungsfokus innerhalb derselben Schule, keine Rollenmutation, kein Account-/Schulwechsel, keine interne Tab-Leiste; Rollenunion und RLS bleiben unverändert. **Die Art der Persistenz der bevorzugten Rollenansicht ist erst in Runde 12 zu entscheiden**. Nicht stillschweigend festlegen.

## 3. Einzuarbeitende Dokumentation

1. `doc/DECISIONS.md`: Runde-11-Tabelle UX-DEC-15 bis UX-DEC-26 ergänzen, ohne D-001 bis D-024 oder frühere UX-Beschlüsse zu verändern. Falls der aktuelle Stand schon weiter ist: gezielt mergen, nicht auf Version 1.1 zurückstufen.
2. `doc/UI_UX_SPECIFICATION.md`: Dashboard-Spezifikation mit v1.2-Inhalt aus dem Übergabepaket ergänzen, alte abweichende **Vorschläge** durch klare Vorranghinweise ersetzen; Screen-/Widget-IDs W-01 bis W-06 erhalten. Bestehende ergänzende Abschnitte behalten.
3. `doc/design.md`: Campus Purple, 12px Radius, 4px Grid und WCAG-Ziele unverändert lassen; Dashboard-Hierarchie und Rollenansichten ergänzen.
4. `doc/UI_UX_DECISIONS_RUNDE_11.md`: als Referenznachtrag ergänzen oder bei bereits vorhandenem gleichwertigem Nachtrag konsistent integrieren.
5. `doc/ACCEPTANCE.md` und ggf. `doc/IMPLEMENTATION_PLAN.md`: Wenn die projektspezifische Dokumentationsstruktur das verlangt, die **Soll-Abnahmen UX11-T01 bis UX11-T16** referenzieren, ohne Tests als ausgeführt oder bestanden zu markieren.
6. Dokumentiere jede echte inhaltliche Kollision mit neueren Dateien. Sicherheits-/Architekturregeln niemals aufgrund eines UI-Dokuments abschwächen.

## 4. Unveränderliche Campus-Grenzen

- Eine Schule = ein Campus; ein Auth-Konto gehört genau einer Schule; keine zentrale fachliche Multi-School-Identität, keine Schulwechsel-Funktion.
- Bestehender Stack React Native/Expo/Expo Router/React Native Web/TypeScript strict + Supabase.
- Serverseitige Rollen-/Objektberechtigungen, `school_id` und RLS; UI-Sichtbarkeit ist keine Zugriffskontrolle.
- Keine öffentliche Registrierung, kein selbst gebauter Auth-/Passwortservice.
- Lehrer-Reset nur nach tatsächlicher Autorisierungs- und Identitätsprüfung, ohne Einblick in altes/neues Passwort.
- Keine produktiven späteren Module (Stundenplan, Aufgaben, Messenger, Noten, Eltern-Kind-Ansichten usw.) in v0.1.
- Bestehende UX-DEC-01 bis UX-DEC-14 gelten weiter, insbesondere Sidebar/Bottom Navigation, globale Suche, Browser-Tabs, zugängliche Widget-Steuerung.
- Auth-, Hosting-, IAM-/RLS- und Datenschutz-Gates bleiben unverändert offen, solange **nicht durch aktuelle Belege** freigegeben.

## 5. Qualitätsprüfung (Dokumentation, **keine Implementierung**)

- Prüfe Dateiverweise, Markdown-Tabellen, Nummerierungen und doppelte IDs.
- Prüfe Konsistenz zwischen `DECISIONS`, `UI_UX_SPECIFICATION`, `design`, `ARCHITECTURE` und `SECURITY_AUTH`.
- Prüfe, dass UX-DEC-17 **nicht** als Verbot der Widget-Personalisierung verstanden werden kann.
- Prüfe, dass Rollenfokus **niemals** eine Rechte-/Rollenumschaltung suggeriert.
- Prüfe, dass UX11-T01 bis UX11-T16 nur **Abnahmeanforderungen**, keine angeblich bestandenen Tests sind.
- Führe keine Datenbankmigrationen, keinen Supabase-Reset und keine Auth-/RLS-Codeänderungen durch; ändere auch keine React-Komponenten.
- Keine echten Schüler-/Schuldaten, Secrets oder Tokens in Beispielen.

## 6. Abschlussbericht

Liefere auf Deutsch:

1. Tatsächlichen Branch, Commitbasis und `git status`.
2. Liste der geänderten bzw. neu angelegten Dokumente und Zusammenfassung der Diffs.
3. Kurze Tabelle UX-DEC-15 bis UX-DEC-26: integriert / bereits vorhanden / Konflikt.
4. Eventuelle verbleibende Widersprüche und noch offene Fragen aus Runde 12 (als **nicht beschlossen** markieren).
5. Prüfungen mit echtem Ergebnis; nicht durchgeführte Prüfungen separat nennen.
6. Optional einen kleinen Dokumentations-Commit auf dem sicheren Feature-Branch, **kein eigenständiger Push oder Merge** ohne Aufforderung.

**Wichtig:** Keine automatische Codeimplementierung. Das Entwicklungs-/Implementierungsbriefing erfolgt erst nach gesonderter Freigabe. Keine stillschweigenden Produktentscheidungen.
