# Campus – Technische Zielarchitektur und ADR-001
Version 1.0 · Fachlich beschlossen, Auth- und Hosting-PoC noch ausstehend.

## Systemgrenzen
- Expo/React Native Web ist der gemeinsame UI-Code; `src/app` Expo Router. Web-First, native Teststarts Pflicht.
- Supabase Managed: **ein Projekt, eine PostgreSQL-Datenbank** für alle Schulinstanzen; projektweite Auth-Infrastruktur, jedoch je Schule **unabhängige fachliche Konten**.
- Pro Schule eine `schools.id` (UUID), ein `slug`, ein Status, eigene Benutzerprofile, Rollen, Klassen, Kurse, Konfiguration.
- **Keine** gemeinsame Benutzeridentität über Schulen, kein schulübergreifender Kontotransfer, keine Fachadministration über mehrere Schulen.
- URLs der Art `https://<slug>.<domain>`; host->slug->school_id wird in vertrauenswürdigem Serverkontext anhand Allowlist/Validierung aufgelöst. Clientseitige School-ID wird nie als Autorisierungsnachweis anerkannt.
- Technische Betreiber-CLI läuft ausschließlich im kontrollierten Betreiberkontext, mit gesondertem Zugang und Audit, nicht in Expo und nicht als allgemein zugänglicher Edge-Function-Endpunkt.

## Mandantenkontext
Jede Auth-UUID verweist auf **genau eine** Schule. Prüfen: `auth.uid()` -> privates `account_school`/`school_memberships` -> active? -> school_id. Unabhängige Accounts können in zwei Schulen denselben Benutzername tragen, niemals dieselbe Auth-UUID. Für jeder Query und Mutation prüfen: Schulzugehörigkeit des Auth-Accounts == `school_id` der Ressource; zusätzliche fachliche Zugriffsbedingungen.

## Auth-Grenze
`signIn(username,password,schoolSlug)` als **zu validierende** Edge Function. Supabase Auth erledigt Passwortprüfung, Tokens und Refresh. Kein Clientzugriff auf Benutzername->Auth-Identifikator-Verzeichnis. Dokumentierter Supabase-Standard unterstützt Passwort-Login über E-Mail/Telefon, nicht Username: technischer PoC ist harte Voraussetzung. Login-Gateway niemals Nutzerdaten oder interne Auth-Identifikatoren offenlegen; Rate-Limit, generische Fehler, TLS, Log-Redaktion, Tests gegen Timing/Enumeration. Session darf nach Login nicht in anderen Schulkontexten nutzbare Daten liefern.

## Hosting und Navigation
Wildcard-TLS und DNS plus Provider-Routing der Schul-Subdomains beweisen. Für iOS/Android Schule über Eingabe von Schuladresse/Schulcode zum **Auffinden des getrennten Kontos** wählen; keine schulübergreifende Kontoverknüpfung und kein automatischer Kontowechsel. Domain, Hostinganbieter, Auth-Deep-Link-Rückleitungen und Callback-Allowlist vor Staging festlegen.

## Funktionale Module Foundation
Auth & Recovery; schulinterne Identität; IAM; Schulorganisation; Moduleinstellungen; Dashboard; Audit; CLI-Provisionierung; CSV-Benutzerimport. Spätere Module als deaktivierte Navigation/Leerzustand, keine fake Live-Daten.

## ADRs
- ADR-001 Accepted: gemeinsam gemanagte Supabase-Infrastruktur mit `school_id`-Mandantentrennung.
- ADR-002 Accepted: separate fachliche Konten je Schule trotz geteilter Auth-Infrastruktur.
- ADR-003 Accepted (Produkt), Pending (Technik): username/password ohne Pflicht-E-Mail.
- ADR-004 Accepted (Produkt), Pending (Betrieb): eigene Schul-Subdomain.
- ADR-005 Accepted: keine globale fachliche Betreiberrolle; CLI nur Provisionierung/Wiederherstellung.

## Versionierung & Konfiguration
Separate lokale, Staging- und Produktiv-Supabase-Projekte. Dieselben geprüften SQL-Migrationen. Geheimnisse ausschließlich in Secret-Store/geschützter Runtime. Ins Frontend nur öffentliche Supabase-URL/Publishable-Key. Change-Management mit PR und Migrationstest.
