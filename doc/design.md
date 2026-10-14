# Campus Design System 1.0

## Grundprinzipien

- **Stil:** Modern und minimalistisch
- **Zielstandard:** WCAG 2.2 AA

## Farben

**Markenfarbe:** `#4C1D95`

| Modus | Background | Surface  | Text      | Action (Primary) | Accent    |
|-------|------------|----------|-----------|-------------------|-----------|
| Light | `#F8F7FC`  | `#FFFFFF`| `#1A1028` | `#4C1D95`         | `#F1EAFF` |
| Dark  | `#120C1D`  | `#1D152A`| `#F7F3FF` | `#A78BFA`         | `#302046` |

Ergänzung (Campus Foundation v0.1 Entwicklungsauftrag, 13.10.2026): Accent-Token
hinzugefügt, bestehende Werte unverändert.

**Modi:** Hell, Dunkel und System

## Layout

- **Kartenradius:** 12px
- **Basisabstand:** 4px

## Dashboard-Design – verbindliche UI/UX-Runde 11 (13.10.2026)

Diese Ergänzung konkretisiert das Erscheinungsbild der Foundation; die Farben, 12-px-Kartenradien, 4-px-Basisabstände und WCAG-2.2-AA-Ziel bleiben unverändert. Maßgebend ist die volle Spezifikation `doc/UI_UX_SPECIFICATION.md` v1.2, Abschnitt 6 und 17.

### Hierarchie und Einstieg

- **Direkter Content-Einstieg:** Kein großflächiger Hero- oder Begrüßungsbanner. Die Startseite zeigt unmittelbar den Dashboard-Inhalt.
- **Kompakter Schulkontext:** W-01 „Mein Campus“ oben und dauerhaft sichtbar; Schulname und freigegebene Basisinformationen ohne Schulwechselmöglichkeit.
- **Anlassbezogene Sicherheit:** W-06 als eigenständiger, zugänglicher Hinweis nur bei tatsächlich relevantem Zustand. Solange relevant, nicht ausblendbar.
- **Raster:** Wiederverwendbare `small`-/`large`-Widgets. Mobile Geräte nutzen responsive Umbrüche; keine abgeschnittenen Texte oder nur horizontal scrollbaren Pflichtinhalte.

### Rollen und Widgetsteuerung

- Widgets werden **automatisch** nach aktuellen Rollen, Rechten und realen Foundation-Daten bereitgestellt.
- Die Auswahl einer Rollenansicht bei Mehrfachrolle ordnet den **inhaltlichen Schwerpunkt**, nicht Rollen, Navigation, Zugriff oder Mandantenzugehörigkeit.
- Keine Widget-Bibliothek zum Hinzufügen beliebiger Typen in v0.1. **Bereits verfügbare optionale Widgets** dürfen dennoch per eindeutig bezeichneten Bedienelementen umgeordnet, in geeigneter Größe verändert, ausgeblendet, wieder eingeblendet und zurückgesetzt werden.
- Tastatur, Screenreader und Touch sind gleichwertig; Drag-and-drop ist optional. Icons benötigen zugängliche Namen. Keine Farbe als alleiniger Statusindikator.

### Inhalte und Zustände

- Schüler: eigene Klassen-/Kurszuordnungen und Konto; Lehrkräfte: eigene Kurse, Klassenleitungen und geschützter Schüler-Reset-Einstieg.
- Eltern: eigenes Konto und Schule, noch **keine** Kinderansicht.
- Sekretariat, Schulleitung und Schuladministration: nur nach aktueller Berechtigung zulässige Verwaltungsaktionen und Daten.
- Verständliche Lade-, Leer-, Fehler-, Offline- und Kein-Zugriff-Zustände. Leere Widgets erhalten nur tatsächlich zulässige Aktionen. Keine Fake-Daten und keine scheinbar aktiven späteren Fachmodule.

### Status und spätere Ausbaustufen

**Foundation v0.1:** Kleiner automatischer Widgetkatalog, anpassbares Raster, bei tatsächlichem Anlass Pflicht-/Sicherheitshinweise, individuelle berechtigte Rollenschwerpunkte.

**Später:** Erweiterbare Widgets aus Unterrichts- und Kommunikationsmodulen, freie Widgetbibliothek und weitergehende Personalisierung.

**Nicht beschlossen:** Die finale technische Speicherung der ausgewählten Rollenansicht (Runde 12, Frage 12.8); Breakpoints und genaue Widget-Pixelgrößen sind vor Umsetzung anhand realer Geräte/Zoomstufen zu validieren.

