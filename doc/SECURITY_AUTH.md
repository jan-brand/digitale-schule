# Campus – Authentifizierung, Autorisierung und Sicherheitsanforderungen
Version 1.0 · Entwicklervertrag; mit PoC-Sperren.

## Authentifizierung
- User-facing Login: schulbezogene Subdomain + username + password; E-Mail optional. Benutzername wird serverseitig `school_id`-gebunden normalisiert und aus Vor-/Nachname vorgeschlagen; Änderung nur Admin mit Audit. Gleicher Username an anderer Schule erlaubt.
- Keine offene Selbstregistrierung; Konto-/Einladungsanlage nur per autorisierter Schulverwaltung/CSV oder Operator-CLI.
- Supabase Auth bleibt allein zuständig für Passworthashes, Tokenausgabe, Passwortänderung und Refresh. Selbstgeschriebene Passwortprüfung/Token-Signing verboten.
- **Technischer Gate A:** Supabase Standard-Login arbeitet per E-Mail oder Telefon. Nachweisbares sicheres Muster für username ohne echte E-Mail fehlt bislang. Vor produktionsnaher IAM-Implementierung mit lokalen Auth-Testkonten validieren: Provisionierung, Lookup, Login, Refresh, E-Mail-Anbindung, Error-Semantik, Session-Trennung, Reset.
- Falls technische Ersatz-Auth-Identifier ausprobiert werden: diese niemals als bestätigte Zustelladresse oder tatsächlichen E-Mail-Besitz behandeln; E-Mail-Recovery nicht einfach durch das Überschreiben eines technischen Primäridentifikators zerbrechen lassen. Fehlschlag = Architekturreview mit Produktverantwortlichen, kein stiller Wechsel zu eigener Auth.

## Rechte
- Rechteunion mehrerer Rollen **nur** im eigenen Campus; zusätzliche Beziehung zum jeweiligen Objekt und harte Verbote. Standardrollen STUDENT, TEACHER, PARENT, SECRETARIAT, PRINCIPAL, SCHOOL_ADMIN.
- `PRINCIPAL` nur über geschützte Betreiber-CLI zuweisbar/entziehbar. `SCHOOL_ADMIN` durch Schulleitung oder Admin mit Sonderrecht zuweisbar.
- Schulleitung delegiert nur aus begrenztem Zusatzrechte-Katalog. Schuladmin benötigt ausdrückliche Delegationsfähigkeit; keine direkte/indirekte Selbstaufwertung.
- Lehrer dürfen Schüler-Passwort-Reset in **derselben Schule** auslösen, nie für erwachsene oder privilegierte Rollen; erneute Identitätsprüfung des Schülers, Rate-Limits und Audit.
- Klassenleitung ist Zuordnung zur konkreten Klasse, keine globale Rolle. Schulleitung/Admin oder ausdrücklich berechtigtes Sekretariat darf Zuordnungen verwalten.
- Bei kritischen Rechteänderungen ist `reason` Pflicht; Audit muss mit Mutation atomar sein. Keine zweite Freigabe.
- Letzter aktiver Schuladmin darf nicht durch normale UI/API-Operationen entzogen/gesperrt werden; parallele Transaktionen absichern. Betreiber-CLI-Notfall gesondert protokollieren.

## RLS/Edge/Storage
- `auth.uid()` -> **eine** aktive schulgebundene Identität -> `school_id`; bei jeder Query Ressourcen-School und Objektberechtigungen prüfen.
- RLS und SQL GRANTs ausdrücklich definieren. Exponierte Tabellen nie ohne Policies; `anon` grundsätzlich kein Zugriff auf private Fach-Tabellen.
- `SECURITY DEFINER` nur wenn nötig, fixierter search_path, begrenztes EXECUTE, keine SQL-Injection, technische Reviews.
- Service-Role/Secret keys nur serverseitig; kein Supabase Admin API aus Expo. Geschützte Token/Reset-Tabellen nicht in exponiertem Schema.
- Storage privat; Pfadbindung an school_id plus Storage RLS, MIME-/Dateigrößenkontrolle; Uploads frühestens mit sicheren Policies.
- Web: Schulsubdomain-Session-Isolation, sichere Redirect-Allowlist, Host-Validierung, keine offenen Redirects, CSP/CSRF-Konzept je tatsächlicher Token-Speicherung.
- Keine Geheimnisse, Tokens, Identitätsdokumente oder CSV-Passwörter in Logs, Audit oder Error-Tracking.

## Recovery
- E-Mail nur nach tatsächlicher Verifikation für Zustellung und Recovery. Ohne E-Mail: Lehrkraft autorisiert einmaligen Reset, prüft Identität, Nachweis wird vertraulich ausgehändigt; nur Hash/TTL/consumed_at in DB.
- Einmaliges Verbrauchen atomar; Versuchslimits; Reset-Flow muss verifizieren, dass neues Passwort von Supabase Auth gesetzt wurde. Vorherige Sessions bei Sperrung/Reset und JWT-Verfallszeiten gesondert prüfen; DB-Zugriffe auch bei altem JWT wirksam blockieren.

## Sicherheitstests (Mindest-Gates)
T01 A->B Lese-/Schreibzugriff; T02 fremde school_id im Request; T03 manipulierte JWT/Metadaten; T04 gleiche Username zwei Schulen; T05 Login auf falscher Subdomain; T06 selbst vergebene Adminrechte; T07 indirekte Selbstaufwertung über gemeinsam genutzte Rolle; T08 letzte Admin-Entfernung und Race; T09 PRINICIPAL-Rolle via UI/API; T10 Reset Lehrer->fremde Schule; T11 Reset Lehrer->Erwachsener; T12 Reset ohne gültigen Code/Mehrfachverbrauch; T13 suspendiertes Konto mit altem JWT; T14 fremde Kurs-/Klassen-FK; T15 CSV-Zeile mit Admin-Sonderrechten; T16 private Storage-Datei eines fremden Campus; T17 unnötige Fehlerdaten/Logs; T18 fehlender Pflichtgrund; T19 unbefugter CLI-Aufruf; T20 verifizierte E-Mail-Recovery mit Trennung von anderen Schulen.

## Vor Produktionsfreigabe
Hostingregion und Drittlandtransfers; AVV; Verzeichnis der Verarbeitungstätigkeiten; DSFA-Prüfung; Lösch-/Aufbewahrungsregeln je Bundesland und Datenart; Minderjährigeninformation; Incident-Response; Restore-Test; Pentest/Sicherheitsreview; MFA-Policy für Betreiber/privilegierte Konten; Betriebstests mit Ausfall- und Backup-Szenarien.
