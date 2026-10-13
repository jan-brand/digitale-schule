# Campus UI/UX Runde 11 – Übergabepaket

**Stand:** 13.10.2026  
**Zweck:** Verbindliche Design- und Dashboard-Entscheidungen aus Runde 11 als Markdown-Dateien und ein direkt verwendbarer **Claude-Code-Prompt zum Dokumentationsabgleich**. Das Paket enthält **keinen Code** und ist nicht nach GitHub übertragen.

## Dateien

- `doc/DECISIONS.md` – bestehende Produktentscheidungen D-001 bis D-024 plus UX-DEC-15 bis UX-DEC-26.
- `doc/UI_UX_SPECIFICATION.md` – vollständige v1.2-Spezifikation (bestehende v1.1 plus aktualisierter Abschnitt 6 und neuer Abschnitt 17).
- `doc/design.md` – ursprüngliches Designsystem 1.0 plus Dashboard-Designregeln aus Runde 11.
- `doc/UI_UX_DECISIONS_RUNDE_11.md` – kompakter eigenständiger Entscheidungsnachtrag.
- `CLAUDE_CODE_UI_UX_RUNDE_11.md` – Arbeitsauftrag für Claude Code: Repository prüfen und Dokumente sicher integrieren, **keine Implementierung**.

## Anwendung

1. Entpacken; Claude Code den Inhalt von `CLAUDE_CODE_UI_UX_RUNDE_11.md` als Prompt geben.
2. Die vier Dateien aus `doc/` als **Referenzdateien** bereitstellen. Nicht blind in einen bestehenden Branch kopieren; der Prompt verlangt einen Abgleich mit dem tatsächlich aktuellen Repository.
3. Merge-Diff prüfen, dokumentierte Widersprüche auflösen, danach gegebenenfalls PR für Dokumentation.

## Wichtige Auslegung

- **11.3 B:** Keine frei wählbare Widget-Bibliothek in Foundation.
- **11.11 A:** Bereits automatisch bereitgestellte Widgets weiterhin sortier-/ausblendbar, geeignete Größen änderbar und zurücksetzbar.
- **11.10 B:** Rollenansicht ändert nur Dashboard-Schwerpunkt, **niemals** die Rechte.
- **Runde 12:** Nur vorbereitet, **nicht beschlossen**.

**Gates:** Echte Auth-/IAM-/RLS-gebundene Features bleiben bis zum nachgewiesenen Abschluss entsprechender technischer Gates blockiert.
