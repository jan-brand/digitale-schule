# Campus – Projektplan

Status: Foundation v0.1 zur Umsetzung freigegeben (Planungsstand 2026-10-13). Produktarbeitstitel: Campus.

## Produktvision
Modulare Cloud-Schulplattform für alle Schulformen mit Web, iOS, Android; Zielgruppen Schüler, Lehrkräfte, Eltern, Schuladministration. Langfristig Stundenplan, Aufgaben, Mitteilungen, Kalender, Dateien, Klassenbuch und Verwaltung. Geschäftsmodell: B2B-SaaS für Schulen/Schulträger.

## Verbindliche Entscheidungen
- React Native + Expo Router + TypeScript (Web/iOS/Android)
- Supabase Auth, PostgreSQL, RLS, Edge Functions, Storage und selektiv Realtime
- Eigene Module zuerst; Schnittstellen später; keine separate NestJS-API im MVP
- Cloud-First; EU-Region und Rechtsprüfung vor Produktivbetrieb
- Modern/minimalistisch; Marke `#4C1D95`; Light/Dark/System; teilweise anpassbares Dashboard
- Multi-Tenant: Benutzer können zu mehreren Schulen gehören; Scope- und Objektberechtigungen

## Lieferumfang Foundation v0.1
Anmeldung, Schulkontext, Rollenbasierte App Shell, Profil, Theme, Foundation-Dashboard, Basis-Schulverwaltung, sichere Supabase-Migrationen, Admin-Einladung, automatisierte Rechte-Tests, CI, Entwicklungsdokumentation.

## Out of Scope v0.1
Echter Stunden-/Vertretungsplan, Aufgabenabgabe, Messenger, vollständiger Kalender, Cloud-UI, Klassenbuch, Eltern-Kind-Freigaben, Noten, KI, Zahlungen. Diese Bereiche können als klar markierte deaktivierte Navigationsziele erscheinen.

## Phasen (in Reihenfolge, keine Terminversprechen)
| Phase | Ziel | Lieferung | Abnahme |
|---|---|---|---|
| F0 | Repository-Grundlage | Expo/TS, Routing, Theme, CI, README | Web startet, TS/Lint/Tests laufen |
| F1 | Supabase-Datenbasis | SQL-Migrationen, Constraints, RLS, Test-Factories | zwei Mandanten isoliert |
| F2 | Identität | Login/Logout, Session, Profil, Schulwechsel | Sessionwechsel und Zugriffsrechte korrekt |
| F3 | Foundation UI | Rollenansichten, Dashboard, Adminstrukturen | Web und mobile Navigation getestet |
| F4 | Hardening | Negativtests, Fehlerfälle, Dokumentation, PR | CI grün, keine bekannten kritischen Sicherheitsfehler |
| M1 | Stundenplan | Plananzeigen, Import, Änderungen | fachliche End-to-End-Tests |
| M2 | Aufgaben | Anlegen, Empfänger, Abgaben, Feedback | bestätigte sichere Abgabe |
| M3 | Kommunikation/Kalender | Mitteilungen, Termine, Benachrichtigungen | Rechte und Lesestatus geprüft |
| P1 | Pilotfähigkeit | Audit, Monitoring, Backups, DSGVO-Prozesse | Sicherheits-/Datenschutzfreigabe |

## Priorisiertes Backlog Foundation
| ID | Aufgabe | Prio | Abhängigkeit |
|---|---|---|---|
| ARCH-001 | Expo Router + TypeScript Strict | P0 | – |
| ARCH-002 | Theme-Tokens und responsive UI | P0 | ARCH-001 |
| ARCH-003 | GitHub Actions CI | P0 | ARCH-001 |
| DB-001 | Kernschema, PK/FK/UNIQUE/Indexes | P0 | – |
| SEC-001 | RLS, SQL-Grants, negative Isolationstests | P0 | DB-001 |
| AUTH-001 | Supabase Auth und Session | P0 | ARCH-001 |
| AUTH-002 | Mitgliedschaften und Schulwechsel | P0 | AUTH-001, SEC-001 |
| UI-001 | Rollenbasierte App Shell | P0 | AUTH-002 |
| UI-002 | Foundation Dashboard | P1 | UI-001 |
| ADMIN-001 | CRUD Schuljahr/Klassen/Kurse | P1 | SEC-001 |
| ADMIN-002 | Sichere Einladungen und Rollenvergabe | P0 | SEC-001 |
| QA-001 | Browser-/Mobile-Smoke Tests | P0 | alle |

## Arbeitsregeln
Feature Branch, Pull Request, kleine überprüfbare Commits. SQL-Migrationen werden versioniert. Keine Secrets, reale Personen- oder Schuldaten in Repository/Fixtures. Keine Produktivänderung ohne gesonderte Genehmigung. Unfertige Module als deaktiviert kennzeichnen. Sicherheits- und Datenschutzabnahme sind eigene Gates vor echtem Schuleinsatz.
