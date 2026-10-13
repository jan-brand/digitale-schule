# Campus – IAM, Einladungen und Account Lifecycle

**Version:** 0.4 – fachlicher Spezifikationsentwurf  
**Datum:** 13.10.2026  
**Status:** Entscheidungen aus Runde 1–5 übernommen; gekennzeichnete Ergänzungen zur Freigabe  
**Gültigkeit:** Foundation v0.1, eine Schule = ein Campus, Web-first mit Expo/React Native/Supabase.

## 1. System- und Mandantengrenzen

- Eine `schools`-Zeile entspricht genau einem Campus. Fachadministration ist ausschließlich schulbezogen.
- Ein globaler `auth.users`-Datensatz kann mehreren Campus zugeordnet sein, aber keine schulübergreifenden Fachrechte besitzen.
- Supabase darf mehrere Campus in gemeinsamer Infrastruktur betreiben; `school_id` ist der zwingende Mandantenschlüssel.
- Plattformbetrieb / CLI ist technisch separiert, kein normaler Campus-Fachadministrator.
- Die frühere `organizations`-/Schulträgerhierarchie ist **nicht Teil von Foundation**.

## 2. Verbindliche Rollen- und Rechtebeschlüsse

| ID | Invariante |
|---|---|
| IAM-001 | Rollen innerhalb derselben aktiven Mitgliedschaft werden vereinigt; objektbezogene Einschränkungen und Sicherheitsverbote bleiben vorrangig. |
| IAM-002 | Konfigurierbare Zusatzrechte liegen in einem festen, versionierten Permission-Katalog. |
| IAM-003 | Schuladmins benötigen ausdrückliche Delegationsberechtigung für Zusatzrechte. |
| IAM-004 | Schuladmin und berechtigtes Sekretariat dürfen einladen, begrenzt auf erlaubte Zielrollen. |
| IAM-005 | Kein Benutzer kann eigene Rechte direkt oder indirekt erhöhen. |
| IAM-006 | Erste Administratorzuweisung per geschützter CLI bei Campus-Provisionierung. |
| IAM-007 | Berechtigte Schuladministratoren und Schulleitung verwalten zugelassene Rechte; Plattform-CLI bleibt gesonderter Notfallweg. |
| IAM-008 | Zusatzrechte gelten bis Entzug, nicht automatisch nur für eine Frist; sie erlöschen effektiv bei inaktiver Mitgliedschaft. |
| IAM-009 | Klassenleitung ist eine klassenbezogene Zuordnung für aktive Lehrkräfte, keine Schulrolle. Schulleitung, Schuladmins und berechtigtes Sekretariat dürfen zuweisen. |
| IAM-010 | Kritische Berechtigungsänderungen erfordern Pflichtbegründung und manipulationsgeschütztes Audit. |
| IAM-021 | Schulleitungsberechtigungen können ausschließlich über die geschützte CLI vergeben werden. Normale Schulverwaltung darf sie nicht vergeben oder erhöhen. |
| IAM-022 | Reguläre Verwaltung darf den letzten aktiven Schuladministrator nicht entfernen/suspendieren, wenn dadurch keiner verbleibt. Ausnahme: gesondertes gesichertes Notfallverfahren via CLI. |
| IAM-023 | Kritische Rechteänderungen benötigen keine zweite Freigabe; Berechtigungsprüfung, Begründung und atomarer Audit sind erforderlich. |
| IAM-024 | Die Schulleitung kann Zusatzrechte aus einem abschließend begrenzten Katalog vergeben, ohne jeweils ein individuelles Delegationsrecht erhalten zu müssen. |

**Zu präzisieren:** Schulleitungsentzug ebenfalls ausschließlich CLI (empfohlen); genaue Delegationsgrenzen und wer `roles.assign.school_admin` erhält; Umgang mit kompromittiertem letztem Admin. Die CLI darf nicht über unbeschränkte normale Nutzer-Endpoints verfügbar sein.

## 3. Ressourcen und Autorisierungsentscheidung

Autorisierungsentscheidung `permit` genau dann, wenn: Authentisierung gültig; Membership `active` in Zielschule; mindestens eine erlaubte Rolle/Grant; Ressource gehört zur Zielschule; Objektbeziehung zutreffend; keine gesetzte Sicherheitsveto-Regel; ggf. zusätzliche MFA-/Step-up-Anforderung erfüllt.

**Grundlegende Ressourcen:** `profile:self`; `membership:self`; `school:current`; `memberships:school`; `role_assignments:school`; `permission_grants:school`; `school_years:school`; `classes:school`; `courses:assigned|school`; `class_staff_assignments:class`; `modules:school`; `audit_events:school_limited`.

### Ausgewählter Permission-Katalog

| Permission | Basis-/Delegationsregel |
|---|---|
| `profiles.read.self`, `profiles.update.self` | Alle aktiven Benutzer; eigene erlaubte Felder |
| `memberships.read.self` | Alle aktiven Benutzer |
| `memberships.list.school` | Schulleitung/Schuladmin; Sekretariat nur mit spezifischem Zweck/Erlaubnis |
| `memberships.invite.standard` | Schuladmin; Sekretariat mit Sonderrecht; Schulleitung |
| `memberships.suspend.standard` | Schuladmin/Schulleitung; ggf. delegiert, geschützte Zielrollen ausgenommen |
| `roles.assign.standard` | Schulleitung; Schuladmin mit Delegation |
| `roles.assign.school_admin` | Schulleitung; Schuladmin mit explizitem Sonderrecht; nie an sich selbst |
| `roles.assign.principal` | **Nur CLI** |
| `permissions.grant.allowed` | Schulleitung für Freigabekatalog; Schuladmin mit Sonderrecht |
| `class_leadership.assign`, `.revoke` | Schulleitung, Schuladmin; Sekretariat mit ausdrücklicher Delegation |
| `school_years.manage`, `classes.manage`, `courses.manage` | Schulleitung/Schuladmin; ggf. delegiert; objektbezogene Einschränkungen |
| `modules.configure` | Schuladmin; Schulleitung gemäß Katalog |
| `audit.view.school_limited` | Nur ausdrücklich erlaubte Administratoren/Schulleitung, bereichsbeschränkt |

**Nicht delegierbar über die Schuloberfläche:** CLI-Betreiberrechte, Schulleitungsrollenvergabe, beliebige DB-Rollen, Umgehung von Audit, Umgehung von RLS, Zugriff auf private Fachinhalte ohne Objektbeziehung.

### Letzte-Admin-Invariante

Eine privilegierte Mitgliedschafts-, Rollen- oder Suspendierungsoperation, die `active SCHOOL_ADMIN` reduzieren kann, muss unter transaktionaler Serialisierung pro `school_id` zählen und die Änderung ablehnen, wenn nach der Änderung kein aktiver Admin verbleibt. Beispielsweise pro Schule eine gesperrte Schulzeile und anschließender Recheck im selben DB-Transaktionskontext. Teste konkurrierende Änderungen. Gesperrte/kompromittierte Konten dürfen durch Notfall-CLI deaktiviert werden, kombiniert mit einem dokumentierten Wiederherstellungsablauf.

## 4. Unabhängige Zustandsmodelle

### 4.1 Supabase-Identität (`auth.users`)

- `not_created`: noch keine Identität; Einladung kann bestehen.
- `pending_activation`: Auth-Identität ggf. bereits angelegt, Aktivierung/Verifikation ausstehend.
- `active`: Identität aktiviert. Schulzugriff nur mit aktiver Membership.
- `disabled`: zentraler Zugang administrativ gesperrt (nur begründete separate Plattformaktion).
- `deletion_pending` / `deleted`: geprüfter Prozess bei berechtigtem Löschanliegen; niemals allein aufgrund des Verlassens einer Schule.

Diese Zustände sind ein **fachliches Modell**. Sie sind nicht 1:1 Spalten oder Statuswerte von Supabase Auth; nötige Zustände liegen ggf. in eigenen Tabellen.

### 4.2 Campus-Mitgliedschaft (`school_memberships`)

`invited` -> `active` -> `suspended` -> `active` oder `ended` -> `archived` -> nach Aufbewahrungsregeln `purged`.

- `invited`: noch keine Zugriffserlaubnis auf schulische Inhalte.
- `active`: Zugriff nach Rollen, Grants und Beziehungen.
- `suspended`: sofort kein Schulzugriff; keine Löschung.
- `ended`: endgültiger Austritt; Zugriffsrechte unwirksam, Zuordnung für erforderliche Historie erhalten.
- `archived`: nur eng zweckgebundener Archivzugriff, nie reguläre App-RLS.
- `purged`: fristgemäße Löschung/Anonymisierung nach dokumentiertem Verfahren.

### 4.3 Einladung (`school_invitations`)

`draft` -> `pending` -> `accepted`; Nebenpfade `revoked`, `expired`, `failed` (technischer Fehler, kontrolliert wiederholbar). Bei Neuversand alte Tokens widerrufen. Verbleibende offene Einladungen dürfen keine Rollen aktivieren.

## 5. Einladungsprozess – Normalfall

1. Actor authentifizieren, Ziel-Campus und effektive Mitgliedschaft ermitteln.
2. `memberships.invite.standard` + zulässige Zielrollen + Self-/Privilege-Grenzen serverseitig prüfen.
3. Mindestdaten aufnehmen: Kontaktweg (wenn vorhanden), Anzeigename oder Personenreferenz, Schule, angebotene Rolle, Einladungsart. Grundsatz Datenminimierung.
4. Vorhandene Mitgliedschaft und ausstehende Einladung derselben Person/Schule prüfen; race-safe Eindeutigkeitsregeln, soweit Identität bestätigt.
5. Invitation mit Ablauf und **Hash statt Klartext** des geheimen Einladungsnachweises erzeugen; Token nur einmal anzeigen/versenden; Event auditiert.
6. Geeigneten Kanal wählen: E-Mail für Erwachsene; gesondertes schulisches Aktivierungsverfahren für Minderjährige ohne E-Mail.
7. Beim Einlösen Token prüfen: Signatur/Hash, Ablauf, Verwendungsstatus, Schulbindung; Identität unabhängig bestätigen.
8. Neue Auth-Identität sicher aktivieren oder für bestehendes Konto Authentifizierung verlangen; E-Mail-Adresse allein begründet keinen Account-Merge.
9. Membership in der expliziten Schule erstellen/aktivieren; nur zuvor erlaubte Rollen zuweisen; Einladung atomar als verbraucht markieren und Audit schreiben. Fehler dürfen nicht zu teilweise aktiven Rechten führen.
10. Campus-Auswahl aktualisieren; Benutzer gelangt zum geeigneten Start-Dashboard. Bei erneutem Linkaufruf keine erneute Rechtevergabe.

### Bestehendes Konto

Die gewöhnliche `supabase.auth.admin.inviteUserByEmail`-Methode ist für neue E-Mail-Identitäten gedacht und liefert bei bereits bestätigtem Konto einen Fehler; Campus benutzt für zusätzliche Campus-Mitgliedschaften einen **eigenen schulgebundenen Invitation-/Accept-Flow** nach Login mit vorhandener Identität.

### Minderjährige

- Einladungsdaten und Kanäle nach Schulform/Alter differenzieren; kein privater Mailaccount als technische Pflicht.
- Noch offen: Schulgenerierte Einmalcodes, betreute Aktivierung, Identitätsnachweis, Passwort-Reset bei Minderjährigen, Elterninformation und ggf. elterliche Mitwirkung.
- Ein Code darf nicht allein unbeschränkte Eltern-/Schülerrechte schaffen; Missbrauchs- und Rate-Limit-Schutz erforderlich.
- Elternzugriff nur über separate später verifizierte Eltern-Kind-Beziehung, nicht über Namensübereinstimmung.
- Rechtsgrundlage und Unterrichtung nach Landesrecht/Funktion prüfen, nicht pauschal DSGVO-Einwilligung annehmen.

## 6. Account-/Membership-Lebenszyklus und Benutzerabläufe

| Ereignis | Systemverhalten | Schutzregel |
|---|---|---|
| Erster Campus-Bootstrap | Operator authentifiziert CLI, verifiziert Schule, vergibt ersten Admin, audit | Identität/Berechtigung der CLI getrennt; idempotent |
| Erstlogin | Auth Session prüfen, Mitgliedschaften laden, letzten gültigen Campus wiederherstellen | Nur `active` Membership; kein Zugriff auf `invited` |
| Weitere Schule | Nach Akzeptanz neuer Einladung zweite Membership; keine Account-Duplikation | Alte Schulrollen nicht auf neue Schule kopieren |
| Schulwechsel | Membership erneut prüfen, school-scoped Queries/Caches invalidieren, neuen Kontext laden | Keine verspäteten Antworten aus vorheriger Schule rendern |
| Rollenänderung | Berechtigung und target prüfen; bei kritisch Pflichtbegründung; Änderung + Audit atomar | Self-escalation und Rollen-/Grant-Ketten verweigern |
| Klassenleitung | Aktive Teacher-Membership und passende Schule/Klasse prüfen; Assignment anlegen/entfernen | Nur Klassenkontext, keine globalen Rechte |
| Einladung widerrufen | Einladungsnachweis sofort unbrauchbar machen | Aktiviertes Mitglied nicht allein per Invite-Revoke sperren |
| Einladung abgelaufen | Erneut autorisierte Neuausstellung | Nie automatisch alten Token verlängern |
| Mitglied suspendieren | Schulzugriff serverseitig unmittelbar blockieren | Auch mit gültigem JWT kein Schulzugriff; Sitzungs-Caches bereinigen |
| Reaktivieren | Erlaubten Actor, Gründe und aktuelle Rollen prüfen; Audit | Kein automatisches Wiederaufleben veralteter Zusatzrechte ohne definierte Regel |
| Mitgliedschaft beenden | Rechte sofort ungültig; Schuldaten zweckgebunden archivieren | Kein Login- oder Zugriffseffekt auf andere Schulen |
| Passwort vergessen | Auth Recovery und kontrollierte Redirects, altersgerechter Weg separat | Keine Kontenexistenz-Auskunft nach außen |
| E-Mail ändern | Verifikation nach Auth-Vorgaben; offene Einladungen separat behandeln | Keine unbeabsichtigte Kontoübernahme |
| Zentralen Zugang sperren | Nur getrennt autorisierte Betreiberentscheidung | Mehrere Schulen betroffen; Ausnahmeprozess dokumentieren |
| Datenexport/Löschersuchen | Identität, Rechtsgrundlage, Aufbewahrung, Verantwortlichkeiten prüfen | Keine pauschale Sofortlöschung gesetzlich benötigter Unterlagen |
| Letzter Schuladmin geht | Normale UI verweigert Removal, CLI-Notfall/Provisionierungsweg | Parallelität kontrollieren |

## 7. Fachliches Datenmodell – Ergänzungen (noch keine finale SQL-Migration)

`school_invitations(id, school_id, invited_by_membership_id, invited_identity_hint, proposed_role_codes, delivery_method, token_hash, status, expires_at, accepted_by_user_id, accepted_at, revoked_at, created_at)`.

`school_memberships(id, school_id, user_id, status, joined_at, suspended_at, ended_at, ...)` – Eindeutigkeit pro (`school_id`, `user_id`) für laufende Mitgliedschaft, Verlauf gesondert modellieren.

`role_assignments(id, school_id, membership_id, role_code, assigned_by_membership_id, created_at, revoked_at)`; `permission_grants` analog, inklusive reason und Bezug auf Audit.

`class_staff_assignments(id, school_id, class_id, membership_id, assignment_type, ...)`, mit objektbezogener Rollenprüfung.

`audit_events(id, school_id, actor_user_id, actor_membership_id, action, target_type, target_id, reason, outcome, occurred_at, correlation_id, metadata_minimized)`; Operator-Audits gesondert. Logs dürfen keine Klartext-Tokens oder Passwörter enthalten.

**Technik:** `(school_id, id)`-Schlüssel und zusammengesetzte FKs zur tenant-sicheren Referenz; RLS + SQL grants auf exponierten Tabellen; privilegierte mutations atomar über sorgfältig begrenzte DB-Operationen. Exakte FK-Designs, Indizes, Privilege-Escalation-Graphen und Policies folgen in DATA_MODEL/SECURITY.

## 8. Foundation-Screens / Domain-Operationen

- `login`, `forgot-password`, `accept-invitation`, `school-select`, `dashboard`, `profile`, `settings`.
- `admin/members`, `admin/invitations`, `admin/roles`, `admin/class-leadership` als Foundation-Verwaltungsoberflächen (ggf. iterativ in M2).
- `auth.signIn`, `.signOut`, `.resetPassword`; `schools.listMine`, `.select`; `invitations.create`, `.accept`, `.revoke`, `.resend`; `memberships.suspend`, `.reactivate`, `.end`; `roles.assign`, `.revoke`; `permissions.grant`, `.revoke`; `classLeadership.assign`, `.revoke`.
- Auth-/Schulkontext mit `loading`, `empty`, `error`, `success`; niemals optimistischen Erfolg bei privilegierter Operation anzeigen, solange DB-Transaktion nicht bestätigt.

## 9. Verbindliche Abnahmetests

| Test-ID | Erwartung |
|---|---|
| IAM-T01 | Schuladmin A kann keine Einladung für Schule B erstellen oder akzeptieren. |
| IAM-T02 | Schulleitung lässt sich über normale UI/API nicht zuweisen/entziehen, auch nicht von anderem Schulleitungsmitglied. |
| IAM-T03 | Schuladmin ohne `roles.assign.school_admin` kann keinen Schuladmin ernennen. |
| IAM-T04 | Letzter aktiver Admin kann per gewöhnlicher Suspendierung, Rollenentzug, Ende oder Löschung nicht entfernt werden. |
| IAM-T05 | Gleichzeitige Admin-Änderungen können die letzte-Admin-Regel nicht umgehen. |
| IAM-T06 | Kritische Rollen-/Grant-Änderungen ohne Begründung werden abgelehnt. |
| IAM-T07 | Kein zweiter Approver ist notwendig, sofern alle vorgeschriebenen Prüfungen erfolgreich sind. |
| IAM-T08 | Schulleitung vergibt ausschließlich Grant aus erlaubtem Katalog. |
| IAM-T09 | Kein Actor erhöht Rechte an sich selbst oder mittelbar über eine von ihm selbst genutzte Rolle. |
| IAM-T10 | Einladung für bestehenden Benutzer erstellt keine doppelte Auth-Identität. |
| IAM-T11 | Einladung kann nur einmal eingelöst werden; abgelaufener/widerrufener Token verweigert. |
| IAM-T12 | Einladung für Minderjährige ohne private E-Mail ist im gewählten Aktivierungsverfahren möglich (nach dessen Festlegung). |
| IAM-T13 | Suspendierte Membership kann trotz bestehender Auth-Session keine schulischen Daten lesen. |
| IAM-T14 | Beim Wechsel A -> B wird keine A-spezifische Response in B angezeigt. |
| IAM-T15 | Austritt A zerstört nicht Anmeldung oder Membership von B. |
| IAM-T16 | Elternrolle allein erlaubt keine fremde Schülerdatenabfrage. |
| IAM-T17 | Klassenleitungsberechtigung funktioniert nur für zugewiesene Klasse. |
| IAM-T18 | Audit ist bei kritischer Änderung atomar; Audit-Ausfall verhindert Änderung. |
| IAM-T19 | Secrets/Tokens fehlen in Logs und Frontend-Bundle. |
| IAM-T20 | Unberechtigte Einladungsversuche verraten nach außen keine Kontenexistenz. |

## 10. Datenschutz-/Betriebsanforderungen

- Zweck und Rechtsgrundlage je Datenkategorie; DSFA-Prüfung für Umfang und Verarbeitung von Minderjährigendaten.
- Datenschutzrechtlich verantwortliche Rollen und AVV/Hostingstandort vor Echtdaten klären.
- Schul- und Landesrecht spezifische Aufbewahrungsfristen und archivierte Auskunfts-/Löschverfahren klären.
- Kontaktinformationen, Audit-Texte und Einladungsdaten minimieren; Retention je Typ festlegen.
- MFA für privilegierte Konten; CLI mit getrennter starker Betreiberidentität und nachvollziehbarem Notfallverfahren.

## 11. Offene Entscheidungen, nicht implementierungsreif

- **OPEN-01:** Wer darf Schulleitungsrolle via CLI widerrufen, welche Betreiberkontrolle wird dafür benötigt? Empfohlen nur CLI, keine Schulleitungs-Selbständerung.
- **OPEN-02:** Darf ein Admin `roles.assign.school_admin` weiterdelegieren oder nur Schulleitung/CLI? Empfohlen: keine rekursive Delegation ohne ausdrückliche Freigabe.
- **OPEN-03:** Geprüfter Aktivierungskanal/Identitätsnachweis für Grundschüler, Schüler ohne E-Mail und Eltern.
- **OPEN-04:** MFA-Methode, Recovery, verlorenes Gerät, temporäre Sperrung, Kontozusammenführung.
- **OPEN-05:** Welche Kontaktdaten darf die Schule eintragen, wer verifiziert sie, welche Einladungstexte sind altersgerecht?
- **OPEN-06:** Rechtsgrundlage, Datenschutzverantwortung und Lösch-/Aufbewahrungsregeln pro Bundesland/Datenart.
- **OPEN-07:** Regeln zum Wiederaufleben von Rollen bei Reaktivierung; empfohlen risikoreiche Grants gesondert bestätigen.
- **OPEN-08:** Status-/Historienmodell für mehrfachen Austritt und Wiedereintritt derselben Schule.
- **OPEN-09:** Maßnahmen gegen E-Mail-Enumeration, Einladungs-Spam und Aktivierungscode-Diebstahl; Rate Limits.
- **OPEN-10:** Betreiber-CLI: Provisionierung, Break-glass, Audit, Rotation/Verwahrung von Credentials und Vier-Augen-Kontrolle der Betreiberidentität (unabhängig von nicht geforderter zweiter Schulfreigabe).

## 12. Umsetzungsvorbehalt

Dies ist eine fachliche Spezifikation und **noch kein implementierter Auth-, Rechts- oder Einladungsdienst**. Vor SQL/Edge Functions: offene sicherheitskritische Punkte entscheiden, Berechtigungsgraph und RLS-Tests konkretisieren, Datenschutzprüfung durchführen. Existierende `doc/design.md` und Entwicklungsbrief nicht überschreiben; beschlossene Entfernung schulträgerübergreifender Fachadministration beim Dokumentationsabgleich berücksichtigen.
