# Campus – Supabase-Datenmodell (Foundation)

## Grundprinzipien
PostgreSQL ist die Source of Truth. `auth.users` gehört Supabase. Fachliche Tabellen werden über versionierte SQL-Migrationen angelegt. Schulbezogene Tabellen besitzen `school_id uuid not null` und zusammengesetzte FKs gegen schulzugehörige Datensätze, damit Cross-School-Referenzen auch bei fehlerhaftem Anwendungscode scheitern. UUIDs als Primärschlüssel; `timestamptz` für Ereignisse, `date` für Schultage.

## Entitäten und Kardinalitäten
| Tabelle | Kerndaten | Beziehung |
|---|---|---|
| `profiles` | id (FK auth.users), display_name | 1:1 Identität |
| `organizations` | id, name, kind | Träger optional |
| `schools` | id, organization_id?, name, status | Organisation 1:n Schulen |
| `school_memberships` | id, school_id, user_id, status | Benutzer n:m Schule; UNIQUE(school_id,user_id) |
| `roles` | id, code, description | feste Systemrollen; Codes unique |
| `role_assignments` | id, membership_id, role_id, scope_type?, scope_id? | Mehrfachrollen, kontrollierte Scopes |
| `school_years` | id, school_id, name, starts_on, ends_on | Schule 1:n Jahre |
| `classes` | id, school_id, school_year_id, name | Klassen je Jahr; eindeutiger Name im Jahr |
| `subjects` | id, school_id, name, code | Fächer je Schule |
| `courses` | id, school_id, school_year_id, subject_id, name | Kurs je Jahr und Fach |
| `course_memberships` | id, school_id, course_id, user_id, participant_role | Teilnehmende und Lehrkräfte |
| `module_settings` | school_id, module_key, enabled, configuration | UNIQUE(school_id,module_key) |
| `user_preferences` | user_id, school_id?, theme, dashboard_layout | personalisiert |
| `audit_events` | id, school_id?, actor_user_id?, action, subject_type, subject_id, occurred_at | append-only, minimale Daten |

## Designentscheidungen
- Rollen: student, teacher, guardian, principal, secretary, school_admin, school_authority, platform_operator. Im MVP nur Grundfunktionen der ersten vier Rollen; weitere vorbereitet.
- `scope_type`/`scope_id` dürfen keine ungesicherten polymorphen Referenzen werden: für v0.1 vorerst nur Schulscope, erweiterte Scopes erst mit Integritäts- und Validierungsregeln.
- Mitglieder müssen explizit eingeladen/zugeordnet werden; kein automatisches `school_admin` nach Signup.
- Klassen-/Kursmitgliedschaften benötigen gleiche Schule und aktive Mitgliedschaft; erzwinge dies mit Constraints bzw. vertrauenswürdigen Serveroperationen.
- Kein Noten-, Gesundheits- oder Eltern-Kind-Auskunftsmodell in v0.1.
- Audit-Tabellen nicht frei editierbar, kein ungeprüfter direkt-clientseitiger INSERT.

## Migration-Reihenfolge
1. Extensions/Enums und Basistabellen.
2. Relationen, UNIQUE/CHECK und zusammengesetzte FKs; zielgerichtete Indizes.
3. RLS aktivieren und SQL-Grants minimieren.
4. Policies/validierte Helper (ohne Rekursionsfallen und Rechteausweitung).
5. Synthetische Seed-Factories und automatisierte RLS-Tests.
6. Generierte TypeScript-Datenbanktypen aktualisieren.

## Testmatrix – mindestens
A = Schüler an Schule A; B = Schüler an Schule B; T = Lehrkraft Schule A; S = Admin Schule A.
- A sieht eigenes Profil und eigene Schulzuordnung, nicht die von B.
- A kann Schule-B-Daten weder SELECT, UPDATE noch INSERT ausführen.
- T sieht nur zugewiesene Kurse, keine nicht zugewiesenen Klassen-/Kursinhalte.
- S kann Admin-Funktion für A ausführen, nicht für B.
- Anonyme Clients sehen keine privaten Fachdaten.
- Bei Widerruf einer Mitgliedschaft entfällt Zugriff sofort auf neue Requests.
