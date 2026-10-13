# Campus Foundation v0.1 – Abnahme und Testplan

## Definition of Done
Die App läuft lokal im Browser und als Expo-App auf mindestens einem Android- und einem iOS-Testziel (Simulator oder Gerät/Build); TypeScript Strict, Lint, Unit- und DB-Policy-Tests laufen in CI. Der Schulkontext und das Profil werden aus Supabase gelesen. Alle Kernbereiche verwenden das Campus-Purple-Theme inklusive Systemmodus und manueller Übersteuerung. Admin-Funktionen besitzen echte Backend-Autorisierung. Fehler- und Leerzustände sind sichtbar.

## Szenarien (Given / When / Then)
| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | Gültiges Konto | Login | Sitzung aufgebaut; eigenes Profil sichtbar |
| AC-02 | Zwei Mitgliedschaften | Schulwechsel | aktiver Kontext wechselt, Daten neu geladen |
| AC-03 | Schüler A von Schule A | liest Schule B direkt über API | Zugriff abgelehnt/keine Zeilen |
| AC-04 | Schüler A | ruft Admin-Edge-Function | 403; keine Änderung |
| AC-05 | Schuladmin A | erstellt Klasse in A | Erfolg, Audit, richtige school_id |
| AC-06 | Schuladmin A | erstellt Klasse in B | Verbot; keine Änderung |
| AC-07 | Unberechtigter Client | versucht Rollenzuweisung | Verbot; keine Rechteerhöhung |
| AC-08 | Authentifizierter Benutzer | meldet sich ab | geschützte Daten/Routen nicht mehr abrufbar |
| AC-09 | Benutzer wählt Dark | App-Neustart | Auswahl aus Preferences wiederhergestellt |
| AC-10 | Benutzer wählt System | OS-Theme wechselt | Oberfläche folgt OS-Theme |
| AC-11 | Supabase nicht erreichbar | Datenzugriff | verständliche Fehlermeldung, kein falscher Erfolg |
| AC-12 | Test-Migrationen | frischer DB-Reset | Schema/Policies reproduzierbar |

## Testanforderungen
- Unit: Theme-Resolver, Validation, Auth-State, School-Switch-Service.
- Integration: authentifizierte und anonyme DB-Zugriffe, alle zentralen RLS-Policies, Fach-Constraints.
- UI-Smoke: Login, Wechsel zwischen Foundation-Routen, Dark Mode.
- CI: Installation mit Lockfile, lint, typecheck, Tests, Web-Build.
- Dokumentierte manuelle Checks auf Android und iOS.

## Abgabe des Teams
PR mit nachvollziehbaren Commits; README-Setup; `.env.example` ohne Geheimnisse; Migrationen; Seed-Daten (künstlich); Testausgabe; dokumentierte Einschränkungen; Screenshots der Web- und mobilen Foundation-Ansicht; keine Freigabe von Produktionssystemen durch den PR allein.
