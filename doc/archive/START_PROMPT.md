# Entwicklungsauftrag: Campus Foundation v0.1

Du arbeitest im GitHub-Repository `jan-brand/digitale-schule` am Produkt **Campus**, einer modularen Schulplattform für deutsche Schulen. **Beginne mit der Implementierung** der technischen Foundation v0.1 und halte dich an die Dokumente in `doc/`.

## Vor der Implementierung
1. Inspiziere das bestehende Repository vollständig. Bewahre bestehende Dateien und Konventionen; überschreibe `doc/design.md` nicht ungefragt.
2. Lies `doc/PROJECT_PLAN.md`, `doc/ARCHITECTURE.md`, `doc/DATA_MODEL.md`, `doc/SECURITY.md`, `doc/ACCEPTANCE.md` und `doc/design.md`.
3. Erstelle einen kurzen Umsetzungsplan und implementiere anschließend in kleinen, überprüfbaren Schritten. Bei Konflikten gilt: Sicherheitsanforderungen > Abnahmekriterien > Architektur > Stilpräferenzen. Dokumentiere Abweichungen.

## Verbindlicher Stack
- React Native + Expo + Expo Router für iOS, Android und Web; TypeScript strict.
- Supabase: PostgreSQL, Auth, Data API, Storage (später), Edge Functions für privilegierte Vorgänge.
- Keine neue NestJS-/Express-/Keycloak-/Prisma-Architektur; kein selbst betriebenes Datenbank-Backend.
- Supabase CLI mit versionierten SQL-Migrationen; niemals produktive Daten oder Secrets einchecken.
- Deep Purple `#4C1D95`, Light/Dark/System, bestehende Designkonventionen aus `doc/design.md`.

## Scope für v0.1 – implementieren
1. Expo-Anwendung für Web/iOS/Android mit Expo Router, TypeScript, lint/typecheck/test Scripts, `README.md`, `.env.example`, `.gitignore` und reproduzierbarer Einrichtung.
2. Wiederverwendbare Theme-Tokens und UI-Primitives (Button, Input, Card, Text, Screen), responsive App Shell und zugängliche Fokus-/Fehlerzustände.
3. Supabase Client mit plattformspezifischer sicherer Session-Persistenz, Login, Logout, Passwort-Reset; Auth-State-Handling. Keine Secret-/Service-Role-Keys im Client.
4. Schema für Schulen, Profile, Mitgliedschaften, Rollen, Schuljahre, Klassen, Fächer, Kurse, Kursmitgliedschaften, Modulkonfiguration, Präferenzen und Admin-Audit (Details in DATA_MODEL); RLS aktivieren und Least-Privilege-Policies/Grants erstellen.
5. Schulkontext-Auswahl bei mehreren Mitgliedschaften; den Schulkontext bei jeder fachlichen Abfrage autorisieren, nie allein dem Client glauben.
6. Rollenbezogene Navigation und Foundation-Dashboards (mit echtem Profil/Schulnamen, fachliche Kacheln zunächst Platzhalter). Schüler dürfen Adminrouten und Admin-API-Aktionen nicht nutzen.
7. Admin-Grundfunktionen: Schuljahr, Klasse, Fach, Kurs anlegen; Benutzer-Einladung und Rollenzuweisung nur über privilegierte Edge Function mit erneuter Autorisierung. Falls Invite nicht ohne externe Zugangsdaten testbar ist, implementiere eine mockbare Abstraktion und dokumentiere den manuellen Integrationstest.
8. Automatisierte Tests: positive und negative RLS-Fälle mit mindestens zwei Schulen; Auth- und School-Switch-Tests; statische Checks und Build. Keine echte Schülerdaten in Fixtures.
9. GitHub Actions CI für Lint, Typecheck, Tests; keine Produktionsdeployments oder Live-Migrationen ohne ausdrückliche Freigabe.

## Nicht Bestandteil von v0.1
Vollständiger Stundenplan, Nachrichten/Chat, Aufgabenabgabe, Noten, Klassenbuch, Eltern-Kind-Rechte, Bezahlung, Push und KI. Keine Platzhalter so darstellen, als wäre eine Funktion fertig.

## Anforderungen an das Ergebnis
- Arbeite in einem Feature-Branch und liefere einen Pull Request, nicht einen direkten Merge auf `main`.
- Jeder sensible Schreibvorgang besitzt serverseitige Autorisierung; Tabellen in exponierten Schemas sind durch RLS + SQL-Grants abgesichert.
- Verifiziere Cross-Tenant-Zugriffe mit Negativtests (Schule A kann Schule B weder lesen noch verändern).
- Keine Umgehung von RLS über ungesicherte `security definer`-Funktionen; bei solchen Funktionen festen `search_path`, explizite Checks und minimale `EXECUTE`-Rechte verwenden.
- Dokumentiere Setup, Migrationen, Testkommandos, Sicherheitsannahmen und noch offene Punkte.
- Gib am Ende einen knappen Bericht: implementierte Dateien, ausgeführte Tests mit Ergebnissen, offene Risiken, notwendige Supabase-Konfiguration und PR-Link.

## Definition of Done
Die Foundation läuft mit synthetischen Demo-Daten auf Web und in Expo Go/Entwicklungsbuilds, Login/Logout funktioniert, ein Benutzer sieht nur eigene Schulmitgliedschaften und Daten, Rollen-/Schulwechsel funktionieren, Adminoperationen sind auf Berechtigte begrenzt, CI ist grün. Falls externe Dienste nicht verfügbar sind, liefere ausführbaren Code und explizit benannte Blocker, behaupte keine ungetesteten Erfolge.

Beginne jetzt mit Repository-Inspektion und der Implementierung der Foundation v0.1.
