# Campus – Backup- und Restore-Konzept (Foundation v0.1)

Scope-Hinweis: Dies deckt `doc/ACCEPTANCE.md` Gate 3 ("Backup/Restore-
Konzept dokumentiert") und `doc/IMPLEMENTATION_PLAN.md` P0-11
("Runbook/Restore-Konzept") ab — also die Foundation-Phase. Die
produktionsreife Fassung (automatisierte wiederkehrende Backups,
Offsite-Lagerung, Monitoring/Alerting auf fehlgeschlagene Backups,
vertraglich/rechtlich festgelegte Aufbewahrungsfristen, regelmäßige statt
einmalige Restore-Übung) ist explizit Gate 4 ("Betriebskonzept,
Rollback, Monitoring, Incident, Restore-Test", `doc/DECISIONS.md`
GATE-LEGAL) und noch nicht gebaut.

## Aktueller Stand (ehrlich, nicht beschönigt)

- **Kein automatisiertes, wiederkehrendes Backup auf dem Server.** Jedes
  Backup in dieser Sitzung wurde manuell unmittelbar vor einer
  Schema-Änderung gezogen, nie auf einem Zeitplan.
- **Kein Offsite-Speicher.** Backups landen bisher nur lokal auf der
  Entwickler-Maschine (`/Users/max/.claude/jobs/*/tmp/backups/` in
  dieser Sitzung — ephemer, wird beim Schließen des Jobs gelöscht),
  nicht in einem dauerhaften, vom Produktionsserver getrennten Speicher.
- **Kein automatisches Backup von Supabase Storage.** Nicht relevant für
  Foundation v0.1 (die App nutzt noch kein Storage, siehe
  `doc/ACCEPTANCE.md` Gate-2-Audit), wird aber relevant, sobald Dateien
  (Profilbilder, Dokumente) hinzukommen — `doc/SECURITY.md`: "DB-Backups
  sichern nicht automatisch den Inhalt von Storage-Objekten".
- **Ein echter Restore wurde jetzt zum ersten Mal durchgeführt und
  verifiziert** (siehe unten) — vorher nur Theorie/Verfahren, nie
  tatsächlich ausgeführt.

## Backup-Verfahren (wie es diese Sitzung tatsächlich durchgehend
angewendet hat)

Vor **jeder** Migration, die gegen den echten Server läuft:

```bash
# Tunnel zum Server muss stehen (siehe unten), dann:
/opt/homebrew/opt/postgresql@17/bin/pg_dump -Fc \
  -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -f backups/pre_<milestone>_$(date +%Y%m%d_%H%M%S).dump
```

Wichtig:
- `-Fc` (custom format): komprimiert, erlaubt selektives Restore
  einzelner Objekte, Voraussetzung für `pg_restore` statt `psql`.
- Die lokale `psql`/`pg_dump`-Version muss zur Server-Version passen
  (Server: Postgres 17) — der standardmäßig verlinkte Homebrew-`psql`
  war in dieser Sitzung Version 14 und inkompatibel; `brew install
  postgresql@17` und der volle Pfad
  `/opt/homebrew/opt/postgresql@17/bin/{psql,pg_dump}` waren nötig.
- Das Backup sichert **nur** die Postgres-Datenbank (`public`,
  `internal`, `auth`, usw.) — nicht Edge-Function-Code (liegt separat im
  Git-Repository, `supabase/functions/`) und nicht Storage-Objekte
  (siehe oben, aktuell irrelevant).

## Restore-Verfahren

```bash
# 1) Ziel-Datenbank anlegen (oder eine vorhandene Instanz verwenden)
createdb -O postgres <zieldatenbank>

# 2) Supabase-Plattformrollen müssen existieren, BEVOR restauriert wird
#    (sie sind nicht Teil des Dumps — jede echte Supabase-Instanz hat
#    sie bereits; nur auf einer blanken Postgres-Instanz muss man sie
#    selbst anlegen):
psql -d <zieldatenbank> -c "
do \$\$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end \$\$;
"

# 3) Restore
pg_restore --no-owner --no-privileges -d <zieldatenbank> <backup-datei>.dump
```

Erwartete, harmlose Fehlermeldungen beim Restore auf eine **nicht**
vollständig provisionierte Supabase-Instanz (z. B. eine blanke lokale
Postgres-Instanz wie in diesem Test): `role "authenticated" does not
exist` (behoben durch Schritt 2) und `schema "cron" does not exist` /
`relation "vault.secrets" does not exist` (Supabase-Plattform-Erweiterungen
`pg_cron`/`supabase_vault`, die diese App nicht nutzt — auf einer
echten Supabase-Instanz bereits vorhanden, dort also kein Fehler). Beide
Fehlerklassen betreffen keine eigenen Anwendungsdaten.

## Durchgeführter Restore-Test (2026-10-15)

Erster echter Restore-Test dieses Projekts (vorher nur Verfahren, nie
ausgeführt):

1. Frisches `pg_dump -Fc` vom echten Server gezogen
   (`drill_20261015_160746.dump`).
2. Zeilenzahlen auf dem echten Server vorher notiert: `schools=3`,
   `school_memberships=7`, `profiles=7`, `role_assignments=7`,
   `audit_events=12`, `classes=2`, `courses=3`.
3. In eine komplett neue, leere lokale Postgres-Instanz restauriert
   (nach Anlegen der drei Plattformrollen wie oben).
4. **Ergebnis: alle Zeilenzahlen stimmten exakt überein** —
   `schools=3`, `school_memberships=7`, `profiles=7`,
   `role_assignments=7`, `audit_events=12`, `classes=2`, `courses=3`.
   `supabase_migrations.schema_migrations` enthielt alle 19 verzeichneten
   Migrationen.
5. Einzige Restore-Fehler waren die oben dokumentierten, harmlosen
   `pg_cron`/`vault`-Meldungen — keine Anwendungsdaten betroffen.

**Nicht getestet**: Restore direkt auf eine laufende Supabase-CLI-
Instanz (`supabase start`) statt eine blanke Postgres-Instanz; Restore
unter Lastbetrieb; Restore-Zeit bei realistischer Datenmenge (aktuell
nur ~40 Zeilen über alle Tabellen — ein Produktions-Restore mit
tausenden/Millionen Zeilen hat ein anderes Zeit- und Fehlerprofil, das
hier nicht gemessen wurde).

## Offene Punkte für Gate 4 (nicht Teil dieser Foundation-Phase)

- Automatisiertes, wiederkehrendes Backup (z. B. täglich) mit
  Offsite-Lagerung (nicht auf demselben Server/derselben Maschine).
- Monitoring/Alerting bei fehlgeschlagenem Backup.
- Backup-Verschlüsselung im Ruhezustand (Backup-Dateien enthalten
  vollständige Nutzerdaten, auch wenn aktuell nur synthetische
  Testdaten).
- Festgelegte Aufbewahrungsfrist (landesrechtlich je Bundesland,
  `doc/SECURITY_AUTH.md`).
- Storage-Objekt-Backup, sobald Storage genutzt wird.
- Regelmäßige (nicht nur einmalige) Restore-Übung als fester Prozess.
- Restore-Test auf einer echten, vollständig provisionierten
  Supabase-Instanz statt einer blanken Postgres-Instanz.
