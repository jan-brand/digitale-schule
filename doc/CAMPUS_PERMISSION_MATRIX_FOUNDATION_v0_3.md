# Campus – Rechte- und Ressourcenmatrix Foundation v0.1

Status: Fachlicher Entwurf mit verbindlichen Entscheidungen und gekennzeichneten Vorschlägen  
Stand: 13.10.2026  
Zielpfad: `doc/PERMISSIONS.md`

## Verbindliche Beschlüsse

- Ein Campus entspricht genau einer Schule; keine schulübergreifenden fachlichen Verwaltungsrollen.
- Zentrale Identität kann mehreren Campus angehören; Berechtigungen bleiben je Campus isoliert.
- Standardrollen einer aktiven Mitgliedschaft werden kombiniert. Sicherheitsverbote und Objektbedingungen haben Vorrang.
- Neue Schuladmins dürfen durch Schulleitung oder Schuladmins mit explizitem Sonderrecht ernannt werden.
- Klassenleitung ist eine Klassen-Zuordnung für Lehrkräfte; die Zuweisung erfolgt durch Schulleitung, Schuladmins oder ausdrücklich berechtigtes Sekretariat.
- Kritische Rechteänderungen erfordern eine Begründung, die mit einem Audit-Ereignis gespeichert wird.
- Dauerhafte Zusatzrechte gelten bis Widerruf; bei deaktivierter Mitgliedschaft sind sie unwirksam.
- Keine Selbstaufwertung; erste Schuladministration und technische Wiederherstellung erfolgen über eine gesicherte Betreiber-CLI.

## Semantik

E: eigene Daten; Z: zugewiesene Klasse oder Kurs; S: schulweiter *begrenzter* Verwaltungs-/Stammdatenkontext; D: explizites Zusatzrecht; –: verboten. `S` ist niemals ein pauschales Recht auf sensible fachliche Inhalte.

Zugriff nur, falls Identität authentifiziert, aktive Campus-Mitgliedschaft, gültiges Recht, selbe `school_id`, passende Objektbeziehung, und kein vorrangiges Verbot. Default-deny. Benutzer-eigene Datensätze sind nur feldweise editierbar (keine Rollen-/Sicherheitsfelder).

## Standardrollen

STUDENT Schüler; TEACHER Lehrkraft; PARENT Elternteil (Kinderrechte noch nicht in Foundation); SECRETARIAT Sekretariat; PRINCIPAL Schulleitung; SCHOOL_ADMIN Schuladministrator. Klassenleitung = kontextbezogene Funktionszuordnung, keine zusätzliche globale Rolle.

## Rechte-Matrix: Identität / Schulmitgliedschaften

| Permission | Student | Teacher | Parent | Secretariat | Principal | School Admin |
|---|---|---|---|---|---|---|
| profiles.read.self | E | E | E | E | E | E |
| profiles.update.self | E | E | E | E | E | E |
| memberships.read.self | E | E | E | E | E | E |
| memberships.list.school | – | – | – | S* | S | S |
| memberships.invite | – | – | – | D | S | S |
| memberships.suspend | – | – | – | D* | S* | S* |
| memberships.reactivate | – | – | – | – | S* | S* |

`*` Zugriff minimiert und risikobasiert, keine freie Sperre hochprivilegierter Mitglieder; explizite Regeln für Schutz privilegierter Konten erforderlich.

## Rechte-Matrix: Rollen / Zusatzrechte

| Permission | Student | Teacher | Parent | Secretariat | Principal | School Admin |
|---|---|---|---|---|---|---|
| roles.read.self | E | E | E | E | E | E |
| roles.list.school | – | – | – | – | S | S |
| roles.assign.standard | – | – | – | – | S | D |
| roles.assign.school_admin | – | – | – | – | S | D |
| roles.revoke.standard | – | – | – | – | S | D |
| permissions.grant | – | – | – | – | D | D |
| permissions.revoke | – | – | – | – | D | D |
| permissions.read.audit | – | – | – | – | D | D |

`roles.assign.school_admin` darf nur nach ausdrücklicher Delegation an School Admin vergeben werden. Hohe Privilegien benötigen Schutz gegen direktes und indirektes Self-Escalation. Schulleitung kann Admin ernennen, darf jedoch nicht selbst eigene Rechte erhöhen.

## Rechte-Matrix: Schule / akademische Struktur

| Permission | Student | Teacher | Parent | Secretariat | Principal | School Admin |
|---|---|---|---|---|---|---|
| schools.read | S | S | S | S | S | S |
| schools.update | – | – | – | D | S | S |
| school_years.read | S | S | S | S | S | S |
| school_years.manage | – | – | – | D | S | S |
| classes.read | Z | Z | – | S | S | S |
| classes.manage | – | – | – | D | S | S |
| courses.read | Z | Z | – | S* | S | S |
| courses.manage | – | Z* | – | D | S | S |
| class_leadership.assign | – | – | – | D | S | S |
| class_leadership.revoke | – | – | – | D | S | S |

`*` Lehrer nur explizit zugewiesener Kurs, schulweite Verwaltung keine Einsicht in Unterrichtsinhalte. Eltern-Kind-Zugriff noch nicht Bestandteil der Foundation.

## Rechte-Matrix: Module / Einstellungen

| Permission | Student | Teacher | Parent | Secretariat | Principal | School Admin |
|---|---|---|---|---|---|---|
| modules.read.enabled | S | S | S | S | S | S |
| modules.configure | – | – | – | – | D | S |
| preferences.read.self | E | E | E | E | E | E |
| preferences.update.self | E | E | E | E | E | E |
| school_settings.manage | – | – | – | D | S | S |

## Ressourcenbedingungen und Invarianten

1. Jede schulbezogene Entität besitzt eine `school_id`; zusammengesetzte FKs verhindern schoolübergreifende Beziehungen.
2. Die `school_id` der Zielressource muss mit der aktiven Mitgliedschaft übereinstimmen. UI-seitig ausgewählte Schule verleiht kein Recht.
3. Lehrkräfte dürfen auf `courses` nur im zugewiesenen Kontext schreiben. Klassenleitungsrechte gelten nur für Klassen, denen die Lehrkraft zugeordnet ist.
4. Jeder Zusatzrechts-Grant referenziert `school_membership` und einen fest definierten Permission-Key; keine frei ausgeführten Policies.
5. Delegation erfordert ein eigenes, explizit zugewiesenes Recht. Eine übertragbare Fähigkeit darf nicht aus einem normalen Fachrecht abgeleitet werden.
6. Eigene Rollen- oder Rechtserhöhung ist verboten. Bei Gruppendefinitionen/Rollenänderungen muss auch die indirekte Selbstaufwertung ausgeschlossen sein.
7. Schuladministratoren und Schulleitung sind keine universellen Leser privater Unterrichts-, Nachrichten-, Gesundheits- oder Leistungsdaten.
8. Bei Änderung, Entzug oder Suspendierung ist jede serverseitige neue Aktion unmittelbar gegen den aktuellen Zustand zu prüfen; Client-Caches werden gelöscht bzw. invalidiert.
9. Kritische Änderung nur als atomare serverseitige Transaktion: Autorisierungsprüfung, Änderung, Audit inklusive Pflichtbegründung, Commit bzw. vollständiger Rollback.
10. Kein normaler Anwender darf Audit-Ereignisse ändern oder löschen.

## Administrative Operationen (geplante Verträge)

- `members.invite(school_id, identity_hint, intended_roles, reason?)`
- `members.suspend(school_id, target_membership_id, reason)`
- `roles.assign(school_id, target_membership_id, role_key, reason)`
- `roles.revoke(school_id, target_membership_id, role_key, reason)`
- `permissions.grant(school_id, target_membership_id, permission_key, reason)`
- `permissions.revoke(school_id, target_membership_id, permission_key, reason)`
- `class_leadership.assign(school_id, class_id, target_membership_id, reason?)`
- `class_leadership.revoke(school_id, class_id, target_membership_id, reason?)`

Server ermittelt Akteur aus Auth-Session, nie aus vom Client gelieferten `actor_id`; Zielschule wird gegen alle Zielobjekte validiert. Unzulässige oder widersprüchliche Rollen-/Mitgliedschaftszustände werden abgelehnt.

## Datenmodell-Ergänzungen (Entwurf)

- `role_permissions(role_id, permission_key)` = katalogisierte Standardrollenrechte
- `permission_grants(id, school_id, membership_id, permission_key, issued_by, granted_at, revoked_at, reason)` = explizite Zusatzrechte
- `class_staff_assignments(id, school_id, class_id, membership_id, assignment_type, started_at, ended_at)` = Klassenleitung
- `audit_events(id, school_id, actor_id, action, target_type, target_id, reason, old_data, new_data, created_at, correlation_id)` = manipulationsgeschützte Audit-Ereignisse; gespeicherte Inhalte datenminimiert
- `invitations(id, school_id, intended_role, identity_hint, status, expires_at, issued_by, redeemed_at)` = schulbezogene Einladungen; Tokens ausschließlich gehasht

Bei `permission_grants` und `class_staff_assignments` referenzielle Schulgleichheit und aktive Statusbedingungen serverseitig durchsetzen; kein clientseitiges direktes Bearbeiten privilegierter Tabellen.

## Verbindliche Negativtests vor Freigabe

1. Schüler ruft Administrationsfunktion direkt auf → verweigert.
2. Schuladmin in Campus A ändert Ressourcen in Campus B → verweigert.
3. Lehrer mit mehreren Schulen nutzt Recht aus Campus A in Campus B → verweigert.
4. Suspendiertes Mitglied nutzt alte Session → verweigert.
5. Administrator erhöht eigene Rechte direkt → verweigert.
6. Administrator erhöht eigene Rechte indirekt über Rolle oder Zweitkonto → verweigert bzw. manueller Hochsicherheitsprozess.
7. Sekretariat ohne Zusatzrecht ernennt Klassenleitung → verweigert.
8. Sekretariat mit Zusatzrecht ernennt Lehrkraft einer fremden Schule → verweigert.
9. Unberechtigter Nutzer liest Audit-Ereignisse → verweigert.
10. Kritische Rollenänderung ohne Begründung → verweigert.
11. Fehler beim Audit verhindert oder rollt die zugehörige privilegierte Änderung zurück.
12. Adminrolle erlaubt nicht das Lesen geschützter fachlicher Inhalte.
13. Ungültige Kurs-/Klassen-Fremdschlüssel anderer Schulen → verweigert.
14. RLS, SQL grants und privilegierte Funktionen werden gemeinsam geprüft, inkl. Direkt-API-Zugriff.

## Offene Entscheidungen / Fachfreigabe

- Rechte zum Entfernen der Schulleitung und zur Auflösung des letzten aktiven Schuladmins.
- Kann Schulleitung `permissions.grant` als Standardrecht erhalten, oder nur nach zusätzlicher Delegation?
- Welche konkreten Rechte dürfen School Admins an andere School Admins weiterdelegieren? Delegationsmatrix.
- Vier-Augen-Freigabe für kritische Rollenänderungen oder Audit+Pflichtbegründung allein?
- Präzise Felder der Mitgliederlisten, insbesondere für minderjährige Schüler.
- Umfang der Fachrechte einer Klassenleitung (zunächst nur Zuordnung; spätere Fachmodule separat spezifizieren).
- Datenschutzkonforme Fristen für Einladungen, Audit und ausgeschiedene Mitglieder, je Bundesland/Datenart.
- Kontenaktivierung für Minderjährige und verifizierte Eltern-Kind-Beziehungen.
- MFA-Anforderung und abgesicherte CLI-Provisionierung/Notfallzugriff.

## Technikhinweise

Geplante Umsetzung: Supabase Auth; Supabase PostgreSQL/RLS/Grants; geschützte PostgreSQL-Operationen oder Edge Functions für administrative Aktionen; getrennte Betreiber-CLI. `SECURITY DEFINER` nur bei Notwendigkeit, nicht exponiertes Schema, fixer `search_path`, eingeschränkte EXECUTE-Rechte. Das Frontend prüft Rechte zur UX, aber nicht als alleinige Sicherheitsbarriere.

Referenzen: https://supabase.com/docs/guides/database/postgres/row-level-security und https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
