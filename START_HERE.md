# Campus – Technische Übergabe an das Entwicklungsteam

Stand 13.10.2026. Dieses Paket ist **Planung, kein implementierter Code**. Es wurde **nicht** nach GitHub gepusht.

## Verbindliche Reihenfolge
1. `doc/DECISIONS.md` – alle Entscheidungen und verdrängte Annahmen.
2. `doc/ARCHITECTURE.md` – Systemgrenzen und ADRs.
3. `doc/SECURITY_AUTH.md` – Rechte, Authentifizierung, Reset, Bedrohungen.
4. `doc/DATA_MODEL.md` – Entitäten, Constraints, Migrationen.
5. `doc/IMPLEMENTATION_PLAN.md` – Dateien, Pakete, Tickets und PRs.
6. `doc/ACCEPTANCE.md` – blockierende Tests und Freigabe.

## Erste Aufgabe
Bestehendes GitHub-Repository `jan-brand/digitale-schule` lesen (inkl. `Campus_Projektstart_Paket.zip`, `doc/design.md`, Entwicklungsbrief); Branch `docs/campus-foundation-architecture` anlegen, diese Dateien als Ergänzung in `doc/` übernehmen. Vorhandenes nicht blind überschreiben. Alte Aussagen zu Schulträgern, gemeinsamem Konto oder Schulwechsel durch klar gekennzeichnete Korrekturen ersetzen. PR zur Review.

## Entwicklungsstart
Nach Dokumentationsabgleich Expo-Grundgerüst und lokales Supabase erstellen. **Unmittelbar anschließend blockierenden Auth-PoC**, bevor das endgültige Login-Schema entsteht. PoC-Probleme melden, nicht mit eigenem Passwortsystem umgehen.

## Bewusste Grenzen
Rechtliche/operative Produktivfreigabe ist nicht beschlossen. Schul-Domain/Hostingprovider, genaue Supabase-Auth-Identifier-Technik und jeweilige Landes-Aufbewahrungsregeln sind nachzuweisen. Das ist kein Auftrag, technische Entscheidungen stillschweigend abzuändern.
