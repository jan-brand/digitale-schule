# Campus – Foundation-Entwicklungsbrief v1.0

Status: Übergabeentwurf, Stand 13.10.2026. Keine produktive Freigabe. Produktname Campus ist Arbeitstitel.

## Ziel
Ein lauffähiges, mehrmandantenfähiges technisches Grundmodell einer modularen Schulplattform für Web, iOS und Android. Zielgruppen: Schüler, Lehrkräfte, Eltern, Schuladministration. Basis für spätere Module Stundenplan, Aufgaben, Nachrichten, Kalender etc.

## Verbindlicher Stack
- React Native + Expo + Expo Router + React Native Web, TypeScript strict
- Supabase Managed: Auth, PostgreSQL, Data API, Storage, Edge Functions, optional Realtime
- SQL-Migrationen über Supabase CLI; kein Prisma, kein Keycloak, kein NestJS im MVP
- Einheitliches Designsystem Campus Purple: Brand #4C1D95; Light: Hintergrund #F8F7FC, Surface #FFFFFF, Text #1A1028; Dark: Hintergrund #120C1D, Surface #1D152A, Text #F7F3FF; Dark Action #A78BFA
- Dark Mode: system/light/dark mit manueller Überschreibung

## Lieferumfang Foundation
1. Repo, Expo-Projekt, Web/iOS/Android-Start, CI (Lint, Typcheck, Tests), Entwicklungs- und Staging-Umgebung.
2. Supabase Auth mit Login, Logout, Passwortwiederherstellung, Sitzungsverwaltung, MFA für Privilegierte.
3. Mehrere Schulen pro Benutzer; aktiver Schulkontext; Rollen- und Kontextprüfung; getrennte Schulmandanten.
4. SQL-Schema für profiles, organizations, schools, school_memberships, roles, role_assignments, school_years, classes, subjects, courses, course_memberships, module_settings, user_preferences, audit_events.
5. RLS/Grants für jede exponierte Tabelle; administrative Schreibaktionen über geprüfte Edge Functions/DB-Funktionen.
6. Screens: Login, Recovery, Schulauswahl, Rollen-/Kontextauswahl, Dashboard-Grundansichten, Profil/Theme, Admin-Benutzerverwaltung, Schuljahre/Klassen/Kurse, Modulverwaltung.
7. Dashboard zunächst mit echten Profil-, Schul- und Modulmetadaten sowie definierten Leerzuständen; Stundenplan/Aufgaben/Messenger noch nicht implementiert.
8. Integrationstests, negative Zugriffsprüfungen, Setup- und Betriebsdokumentation.

## Außerhalb des Foundation-Scope
Automatische Stundenplanung, vollständige Aufgaben/Abgaben, Chats, Noten, Klassenbuch, KI, Eltern-Kind-Prozesse, externes SSO, Zahlungsabwicklung, Drittanbieterintegrationen.

## Fachmodell – Kerneigenschaften
- auth.users ist Identitätsquelle; profiles.id referenziert auth.users.id.
- organizations (optional Schulträger) 1:n schools.
- users n:m schools über school_memberships mit status.
- Rollen werden einer Mitgliedschaft zugewiesen; scope_type/scope_id ermöglichen rollenbezogene Kontexte. Für die Foundation können zunächst nur school-weite Rollen aktiviert werden.
- schools 1:n school_years, school_years 1:n classes/courses.
- courses referenzieren subject und school_year; course_memberships ordnen Benutzer als student/teacher zu.
- module_settings je (school_id,module_key) eindeutig.
- user_preferences je (school_id,user_id) eindeutig, theme enum system/light/dark.
- UUID-Schlüssel, timestamptz für Zeitpunkte, date für Schuljahre; indizierte school_id und Mitgliedschafts-Spalten; zusammengesetzte FKs, wo möglich, zur Mandantenintegrität.
- Rollen dürfen nicht per editierbaren user_metadata autorisiert werden.

## Zugriffsvertrag
- Default deny. Authentifizierung und Datenautorisierung sind getrennt.
- Jeder Login erhält nur seine Schulmitgliedschaften, und nur explizit erlaubte Kontextdaten.
- admin ist keine pauschale Leseberechtigung für private Unterrichtsdaten.
- Anlegen/Einladen von Benutzern, Rollenvergabe, Modulaktivierung: serverseitige Prüfungen + Audit.
- Keine Secret-/Service-Role-Schlüssel im React-Client.
- RLS und SQL grants auf exponierten Tabellen; Testen von fremden Schulen, fremden Kursen, deaktivierten Mitgliedschaften und Manipulationsversuchen.
- Storage-Buckets zunächst privat, Storage Policies vor Uploadfreigabe.
- Route Guards dienen UX, nicht als Datenzugriffsschutz.

## Schnittstellen (Frontend-Domainservices)
- auth.signIn, auth.signOut, auth.resetPassword
- profiles.getMe
- schools.listMine, schools.select
- classes.list, courses.list
- admin.inviteUser, admin.assignRole, admin.createClass, admin.createCourse, admin.configureModule
- preferences.get, preferences.update
Alle Funktionen: typisierte Rückgaben, normalisierte Fehler, Ladezustände, keine ungeprüften privilegierten direkten Schreiboperationen.

## Projektstruktur
```
campus/
  src/app/{_layout.tsx,(auth)/,(app)/}
  src/features/{identity,schools,classes,courses,dashboard}/
  src/components/{ui,navigation,layout}/
  src/providers/{AuthProvider,SchoolProvider,ThemeProvider}.tsx
  src/lib/supabase.ts
  src/theme/{colors,spacing,typography}.ts
  supabase/{migrations,functions,tests,seed.sql,config.toml}
  docs/
  assets/
  .env.example
  app.json
  eas.json
```

## Priorisierte Tickets
P0-01 Repo/Expo/TypeScript, Web und native Entwicklungsstarts.
P0-02 Supabase CLI, lokales Setup, getrenntes Staging, Migrationspipeline.
P0-03 Schema + Constraints + Seeds mit mindestens zwei fiktiven Schulen.
P0-04 RLS/Grants + automatische negative Mandantentests.
P0-05 Auth/Session/Recovery/MFA für privilegierte Konten.
P0-06 Mitgliedschaftsbasierter Schulwechsel und Context Provider.
P0-07 Rollen- und Berechtigungskonzept mit getesteten serverseitigen Funktionen.
P0-08 Campus Designsystem, ThemeProvider, primitive UI-Komponenten.
P0-09 Rollenabhängige App Shell, Login, Profil, Dashboard-Platzhalter.
P0-10 Schuladministration für Klassen/Kurse/Mitgliedschaften/Module.
P0-11 Plattformübergreifende Integrationstests und CI.
P0-12 Dokumentation, Sicherheitsreview, Staging-Übergabe.

## Abnahmetests
A1 Login/Logout/Reset; abgelaufene Session sicher behandelt.
A2 Benutzer in zwei Schulen kann den Kontext wechseln; kein Cross-Tenant-Leak.
A3 Schüler kann Admin-Operation weder in UI noch per direkter API ausführen.
A4 Benutzer kann eigene Rolle nicht per Client manipulieren.
A5 Admin-Einladung, Rollenwechsel und Sperrung sind auditiert.
A6 Klassen/Kurse lassen sich nur innerhalb der berechtigten Schule verwalten.
A7 Schuljahrwechsel und referenzielle Integrität sind geprüft.
A8 System/Light/Dark über Neustart geräteübergreifend synchronisiert.
A9 Web/iOS/Android starten; wesentliche Navigations- und Auth-Flows laufen.
A10 Migrationen lassen sich aus leerer Testdatenbank reproduzierbar anwenden.
A11 Fehler-/Leer-/Ladezustände sind vorhanden und zeigen keinen falschen Erfolg.
A12 Keine Secrets im Bundle/Repository, keine sensiblen Daten in Logs.

## Nichtfunktionale Abnahme
- WCAG 2.2 AA als Ziel, Tastatur/Fokus/Screenreader prüfen.
- Sichere TLS-Kommunikation, vertrauliche lokale Token-Speicherung.
- Monitoring, Backup- und Restore-Konzept, Datenschutz-/AVV-Prüfung vor Echtdaten.
- App- und DB-Abhängigkeiten versioniert; CI-Tests bei Pull Requests.
- Reale Schuldaten erst nach rechtlicher Prüfung, Security Review und Pilotfreigabe.

## Offene Entscheidungen vor Produktionsstart
Supabase-Plan und genaue Region, Datenverarbeitungsverträge/Unterauftragnehmer, exakte Aufbewahrungsfristen, Einladungsabläufe für minderjährige Schüler, Admin-MFA-Methode, gewünschte Schulträgerhierarchie, Push-Provider, Domain/Branding, SLA/RPO/RTO mit tatsächlicher Sicherungsstrategie. Diese blockieren nicht alle lokale Foundation-Arbeiten, sind aber vor dem Echtbetrieb verbindlich zu klären.

## Hinweise für das Team
Supabase übernimmt den Datenbankbetrieb, nicht automatisch Datenmodell, RLS-Policies, Migrationen, Prüfungen oder Datenschutzverantwortung. Dokumentation: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native und https://supabase.com/docs/guides/database/postgres/row-level-security sowie https://docs.expo.dev/router/advanced/protected/ .
