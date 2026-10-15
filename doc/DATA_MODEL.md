# Campus – Datenmodell und Datenbankvertrag Foundation v0.1
Version 1.0 · Fachschema; DDL wird erst nach Auth-PoC endgültig eingefroren.

## Modell und Entitäten
| Tabelle | Mindestfelder/Integritätsregel |
|---|---|
| `schools` | id UUID PK, slug CITEXT UNIQUE, name, status, created_at |
| `profiles` | id UUID PK/FK auth.users, school_id NOT NULL, first_name, last_name, status, timestamps; UNIQUE (school_id,id); **UNIQUE(id)** gewährleistet Konto=Schule |
| `login_identifiers` | school_id, profile_id UNIQUE, username_normalized CITEXT, UNIQUE(school_id,username_normalized); privates Schema, keinerlei Client SELECT; technische Auth-Zuordnung PoC-abhängig |
| `school_memberships` | school_id, user_id UNIQUE, status [pending,active,suspended,ended], timestamps; UNIQUE(user_id), zusammengesetzte FK auf profiles; existiert als schulinterner Lifecycle-Datensatz |
| `roles` | code, scope, system_managed; Standardrollen STUDENT, TEACHER, PARENT, SECRETARIAT, PRINCIPAL, SCHOOL_ADMIN |
| `permissions` | code UNIQUE, sensitivity, delegation_class; katalogisiert |
| `role_permissions` | role_id, permission_id; unveränderbare Kernvorlagen |
| `role_assignments` | school_id, membership_id, role_id, granted_by, timestamps; keine Selbstvergabe |
| `permission_grants` | school_id, membership_id, permission_id, granted_by, reason, revoked_at; dauerhaft bis Widerruf; kein beliebiges freies Recht |
| `school_years` | school_id, name, start_date, end_date, status; UNIQUE(school_id,id) |
| `classes` | school_id, school_year_id, name; zusammengesetzte FK zu school_years |
| `subjects` | school_id, code, name; UNIQUE(school_id,code) |
| `courses` | school_id, school_year_id, subject_id, name; zusammengesetzte FK |
| `course_memberships` | school_id, course_id, membership_id, member_type; zusammengesetzte FK |
| `class_staff_assignments` | school_id, class_id, membership_id, kind='lead'; Nutzer muss Lehrkraft derselben Schule sein |
| `invitations` | school_id, subject_type, status, invitee info (minimal), expires_at, token_hash, invited_by, redeemed_at |
| `password_reset_requests` | school_id, user_id, initiator_id, method, token_hash, expires_at, consumed_at; kein Klartextgeheimnis |
| `import_jobs` | school_id, initiated_by, state, source_metadata, counts, timestamps; CSV-Rohdaten zeitnah löschen |
| `import_job_rows` | job_id, row_number, validation_state, error_code, result_account_id; keine Passwörter |
| `module_settings` | school_id, module_key, enabled; UNIQUE(school_id,module_key) |
| `user_preferences` | school_id, profile_id, theme(system/light/dark), locale; UNIQUE(profile_id) |
| `audit_events` | school_id, actor, target, event_key, reason, timestamp, sanitized metadata, correlation_id; eingeschränkter Zugriff |

## Sicherheitsinvarianten
- `profiles.id` referenziert auth.users.id und hat genau eine school_id, nicht umschreibbar durch Client; `school_memberships.user_id UNIQUE`; jede abgeleitete Ressource referenziert dieselbe Schule.
- Zusammengesetzte Foreign Keys `(school_id, related_id)` bei allen schulbezogenen Relationen. Dafür UNIQUE(school_id,id) auf den Zieltables.
- Keine privilegierten Rollen in editierbarem `user_metadata`; Rollen und Rechte aus DB. Auch JWT-Custom-Claims dürfen ohne Aktualitätskontrolle nie alleine über Rechte entscheiden.
- Default-deny für exponierte Tabellen: erforderliche `GRANT`s und RLS; interne sensible Tabellen in nicht exponiertem Schema, EXECUTE nur für ausgewählte Funktionen.
- Rollenvergabe, Rechteänderung, Suspendierung und Reset nur über transaktionale geprüfte Serveroperationen; bei kritischen Mutationen Audit+Pflichtgrund atomar.
- Letzten **aktiven** Schuladministrator durch Transaktion und Sperre vor konkurrierendem Rollenentzug oder Suspendierung schützen. Echter Sicherheitsnotfall via CLI separat.
- Lehrer-Reset nur Zielrolle STUDENT, gleiche Schule, aktiver Lehrer; keine Offenlegung alter/neuer Passwörter.
- Datenarchivierung/löschung nach Datenkategorie und landesrechtlich geprüftem Retention-Plan, kein unbegrenztes Soft-Delete.

## Indizes und Migrationen
`school_id` + häufig benutzte Fremdschlüssel indizieren, einzigartiger normalisierter Benutzername `(school_id,username_normalized)`; Datenbank-Constraints statt App-only-Checks.
1. M001 schools/profiles/memberships + RLS/Grants sofort.
2. M002 Login-Identifier (erst nach PoC Auth-Schema fixieren).
3. M003 Roles/permissions/assignments/grants + Admin Transaktionen.
4. M004 Schuljahre/Klassen/Fächer/Kurse/Klassenleitung + FKs + RLS.
5. M005 Einladungen, Recovery, CSV-Import + geschützte Funktionen.
6. M006 Module, Preferences, Audit, Seed.
7. M007 Sicherheits-Härtung, Integrationstests, Indizes.
Jede Migration muss einzeln gegen frische lokale DB und negatives Zugriffsmodell testbar sein.
