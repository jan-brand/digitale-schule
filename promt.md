# Entwicklungsauftrag: Campus Foundation v0.1

Du entwickelst die technische Grundlage für **Campus**, eine moderne, modulare Schulplattform für Schüler, Lehrkräfte, Eltern und Schuladministratoren.

**GitHub-Repository:** https://github.com/jan-brand/digitale-schule

## 1. Vorbereitung

Analysiere zuerst den vorhandenen Repository-Inhalt. Berücksichtige insbesondere die bereits vorhandene Designbeschreibung `doc/design.md`.

Lies anschließend sämtliche Projektplanungsdateien aus dem bereitgestellten Startpaket.

## 2. Verbindlicher Technologie-Stack

- React Native mit Expo und Expo Router
- TypeScript mit Strict Mode
- Unterstützung für Web, iOS und Android
- Supabase PostgreSQL für sämtliche fachlichen Daten
- Supabase Auth für Benutzerkonten
- Supabase Row Level Security für den Datenzugriff
- Supabase Edge Functions für privilegierte Backend-Aktionen
- Supabase Storage für die späteren Datei-Module

Verwende kein eigenes NestJS-Backend, kein Prisma und keinen selbst betriebenen Datenbankserver.

## 3. Designanforderungen

Verwende das Campus Designsystem:

- Markenfarbe: `#4C1D95`
- Stil: modern und minimalistisch
- Light Mode, Dark Mode und automatische Systemeinstellung
- Einheitliche Komponenten für Web und mobile Apps
- Responsive Navigation
- Zielstandard: WCAG 2.2 AA

## 4. Foundation-Funktionen

Implementiere die technische Grundlage mit:

1. Projektstruktur, Routing und Designsystem
2. Supabase-Anbindung
3. Login, Logout und sicherer Sitzungsverwaltung
4. Schul- und Benutzerprofilen
5. Mehreren Schulmitgliedschaften pro Benutzer
6. Rollen und serverseitigen Berechtigungen
7. Schuljahren, Klassen, Fächern und Kursen
8. Rollenabhängiger Navigation
9. Basis-Dashboards für Schüler, Lehrkräfte, Eltern und Administration
10. Grundlegenden Verwaltungsfunktionen

Weitere Schulmodule werden zunächst als noch nicht verfügbare Funktionen vorbereitet.

## 5. Sicherheit

Aktiviere Row Level Security für alle relevanten exponierten Tabellen. Implementiere und teste eine zuverlässige Mandantentrennung.

Kein Benutzer darf Daten anderer Schulen einsehen oder verändern, sofern dafür keine ausdrücklich geprüfte Berechtigung existiert.

Niemals Service-Role-Keys oder andere privilegierte Geheimnisse im Frontend verwenden.

## 6. Entwicklung und Qualität

Arbeite schrittweise in einem Feature-Branch. Erstelle reproduzierbare SQL-Migrationen, automatisierte Tests, eine `.env.example`, dokumentierte Startanweisungen und GitHub Actions für grundlegende Qualitätsprüfungen.

Verwende ausschließlich künstliche Testdaten.

Überprüfe TypeScript, Linting, Web-Build, Authentifizierung und Sicherheitsregeln. Dokumentiere alle nicht ausgeführten Tests.

## 7. Ergebnis

Die erste Foundation-Version soll eine startbare React-/Expo-Anwendung enthalten, die über Supabase eine Anmeldung ermöglicht, den aktiven Schulkontext lädt und das passende Campus-Dashboard darstellt.

Erstelle anschließend einen Pull Request mit einer Zusammenfassung der Änderungen, Testresultaten und noch offenen Punkten.

**Beginne mit der Analyse des Repositorys und arbeite danach die Foundation v0.1 in der festgelegten Reihenfolge ab.**