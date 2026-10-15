# Campus – Sicherheits- und Datenschutzanforderungen

**Status:** Entwicklungsanforderungen, keine Behauptung bereits bestehender Compliance.

## Unverhandelbare Regeln
1. `anon` und `authenticated` nur minimale SQL-Grants; RLS auf allen exponierten Fachtabellen aktivieren.
2. Supabase Secret/Service-Role Key, SMTP-Secrets und Push-Credentials nie in Mobile-/Webbundle, Repository oder Log.
3. Die Person darf weder ihre Mitgliedschaft noch Rollen frei anlegen/erhöhen. Admin-Einladung und Rollenänderung erfolgen nur über serverseitig geprüfte Operationen.
4. Jede Anfrage prüft Subjekt, Schule, Rolle, fachlichen Scope und ggf. Modulstatus. Frontend-Routenschutz ersetzt RLS nicht.
5. `SECURITY DEFINER` nur wenn zwingend nötig, mit festem `search_path`, eingeschränkten EXECUTE-Rechten und expliziten Identitäts-/Scopeprüfungen.
6. Edge Functions prüfen JWT/Session und danach Autorisierung; privilegierte Datenbankzugriffe sind eng begrenzt und auditiert.
7. Synthetische Testdaten; keine Schüler-/Eltern-Personendaten in Git oder frei zugänglichen Staging-Umgebungen.
8. Keine sensiblen Inhalte in technischen Logs, Crash-Reports, URLs oder Telemetrie.
9. Fehlermeldungen ohne Informationen über fremde Konten und Schulen; Rate-Limits für kritische Flows.
10. Lösch-/Aufbewahrungskonzept je Datentyp, AV-Vertrag und Subprozessorprüfung vor produktiver Nutzung.

## Supabase-Planung
- Projekte nach Umgebung trennen, EU-Region vor Produktivbetrieb prüfen.
- Supabase CLI-Migrationen sind versioniert und überprüfbar; keine ungeprüften SQL-Änderungen nur über Dashboard.
- Auth-Persistenz: SecureStore auf Mobile; Web mit geeignetem Sessionverfahren und XSS-Schutz. Keine Secrets in `EXPO_PUBLIC_*`.
- Storage-Buckets standardmäßig privat; erst bei späteren Uploadmodulen Policies und Datei-Virenscan festlegen.
- DB-Backups sichern nicht automatisch den Inhalt von Storage-Objekten; separate Schutz-/Restore-Strategie erforderlich.

## Security-Gates vor Pilotbetrieb
Sicherheitsreview und Penetrationstest-Risikoanalyse, Restore-Übung, Kontingent-/DDoS-Konzept, Incident-Prozess, Verzeichnis von Verarbeitungstätigkeiten, AV-Verträge, Schuldatenschutzrecht je Bundesland, Prüfung einer Datenschutz-Folgenabschätzung, Barrierefreiheitstests. Keine pauschalen Aussagen über DSGVO-Konformität durch EU-Hosting allein.
