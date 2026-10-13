# Campus – Architektur v1

## Stack
Expo + React Native Web + Expo Router + TypeScript Strict. Supabase (PostgreSQL, Auth, RLS, Data API, Edge Functions, Storage später). App-seitige Repository-/Service-Schicht um `supabase-js`. Keine eigene generische Backend-API für die Foundation.

## Kontexte
- Identität = `auth.users`; öffentliche Profildaten in `public.profiles`.
- Mandant = Schule; `school_memberships` verbindet Identität und Schule.
- Rollen als Mehrfachzuweisung je Mitgliedschaft, später optional auf Klassen-/Kursscope.
- Rolle allein genügt nie; stets Schulmitgliedschaft + fachliche Beziehung + Modulstatus prüfen.
- Wechsel des aktiven Schulkontexts ändert nur den UI-Kontext. Server/RLS prüft jeden Datensatz unabhängig.

## Verzeichnisstruktur
```text
app/                   # Expo Router: auth, school selection, role-specific screens
src/components/ui/     # plattformübergreifende Komponenten
src/features/          # schools, classes, courses, dashboard, identity
src/lib/supabase/      # Supabase Client, typed repositories
src/providers/         # auth, active-school, theme
src/theme/             # Palette + semantische Tokens
supabase/migrations/    # SQL source of truth
supabase/functions/     # privilegierte Serveraktionen
supabase/tests/         # RLS / DB tests
doc/                    # Produkt- und Architekturspezifikationen
```

## UI-Routen (Expo Router)
- `(auth)/login`, `(auth)/reset-password`
- `(app)/select-school`
- `(app)/student/index`, `(app)/teacher/index`, `(app)/parent/index`, `(app)/admin/index`
- `(app)/settings/profile`, `(app)/settings/appearance`
- spätere Features unter separaten Routen (Plan, Aufgaben, Nachrichten, Kalender)

## Initiale Screens
Login, Fehler-/Reset-Flow, Schulwahl, Rollen-/Kontextwechsel, Dashboard je Rolle, Profil, Darstellung, Admin-Listen: Benutzer, Schuljahre, Klassen, Fächer, Kurse, Module. Elternansicht vorerst ohne Einsicht in Kinderdaten, bis Sorge-/Auskunftsrechte modelliert sind.

## Theme
Marke `#4C1D95`; Light: bg `#F8F7FC`, surface `#FFFFFF`, text `#1A1028`, action `#4C1D95`; Dark: bg `#120C1D`, surface `#1D152A`, text `#F7F3FF`, action `#A78BFA`. Systemmodus Standard, Override in Preferences, WCAG 2.2 AA Ziel.

## Schnittstellen
- `auth.signIn`, `auth.signOut`, `auth.resetPassword`
- `schools.listMine`, `schools.select`, `schools.getAvailableRoles`
- `classes.listBySchool`, `courses.listBySchool`, `admin.createClass`, `admin.inviteUser`, `admin.assignRole`
- Auth-relevante Daten niemals aus clientseitigen Claims allein ableiten. Privilegierte Operationen an Edge Functions, interne DB-Funktionen oder restriktive Policies binden.

## Betriebsgrenzen
Entwicklung mit Supabase CLI lokal; Staging/Production getrennte Projekte. Keys über `.env`/Secrets, nur Publishable Key im Client. Edge Functions mit Benutzer-JWT-Prüfung und gesonderter Berechtigungsprüfung; Service-Role ausschließlich serverseitig. Überwachung/Backups/Wiederherstellung für Pilotbetrieb spezifizieren, Supabase allein ersetzt keine Datenschutzprüfung.
