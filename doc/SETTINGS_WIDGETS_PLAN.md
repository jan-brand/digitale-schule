# Campus – Konzept: Widget-basierte Einstellungen (Settings)

**Status:** Umgesetzt (`src/app/(app)/settings.tsx`, `src/components/settings/widgets/`). WCAG-Stichprobe (Tab-Reihenfolge/`aria`-Status der neuen Widget-Controls, siehe Abschnitt 5) steht noch aus — kein Browser/Simulator in dieser Sitzung verfügbar.
**Scope:** `src/app/(app)/settings.tsx`. Keine Änderung an Login, Auth-Logik, RLS oder bestehenden API-Verträgen (`setOwnContactEmail`, `requestOwnEmailVerification`, `signOut`).

## 1. Ziel

Die Einstellungsseite wird auf dasselbe Widget-Muster umgestellt, das bereits für das Dashboard beschlossen und gebaut ist (`doc/UI_UX_DECISIONS_RUNDE_11.md`, `doc/design.md` §„Dashboard-Design“, `src/app/(app)/dashboard.tsx`), statt eine freistehende Liste von Abschnitten zu bleiben. Begründung: Einstellungen und Dashboard teilen dieselben UX-Beschlüsse zu Personalisierung (UX-DEC-25) und Pflichtelementen (UX-DEC-16/17); ein zweites, abweichendes Muster für dieselbe Anforderung wäre ein unbegründeter Bruch mit `doc/design.md`.

## 2. Compliance-Abgleich (Anforderung 1.1.1)

| Dokument | Relevante Vorgabe | Auswirkung auf dieses Konzept |
|---|---|---|
| `doc/design.md` | 12px Kartenradius, 4px-Basisabstand, keine Schatten/Elevation-Tokens definiert, „modern und minimalistisch“ | Widgets nutzen die bestehende `Card`-Komponente unverändert (kein `shadow*`/`elevation`); kein neuer Kartenstil. |
| `doc/DECISIONS.md` (UX-DEC-17, UX-DEC-25) | Automatisch bereitgestellte Widgets, keine freie Widget-Bibliothek; vorhandene optionale Widgets sortier-/ausblendbar, Standard wiederherstellbar | Settings bekommt **keine** Widget-Bibliothek zum Hinzufügen neuer Typen; nur die unten gelisteten, rollenunabhängig immer gleichen Widget-Typen, von denen ein Teil optional personalisierbar ist. |
| `doc/UI_UX_DECISIONS_RUNDE_11.md` (UX-DEC-20) | Eltern: „eigenes Konto, **Grundeinstellungen**“ | Bestätigt, dass Settings für alle Rollen gleichermaßen gilt, nicht nur Admin/Lehrkraft. |
| `doc/UI_UX_SPECIFICATION.md` §6.5 | Verschieben/Aus-Einblenden/Größe ändern über zugängliche Bedienelemente, Tastatur/Screenreader gleichwertig, kein Drag-and-Drop-Zwang | Wiederverwendung von `WidgetEditControls` (bereits accessibility-geprüft, M18) statt einer neuen Implementierung. |
| `doc/SECURITY.md` (#4, #9) | Jede Anfrage prüft Subjekt/Schule/Rolle serverseitig; keine sensiblen Infos in Fehlermeldungen | Reine Layout-Änderung; die bestehenden, bereits serverseitig abgesicherten Aufrufe (`setOwnContactEmail`, `requestOwnEmailVerification`) werden nur umverpackt, nicht verändert. |
| `doc/ACCEPTANCE.md` Gate 3 | „Profile, Schuljahre, … nutzbar“ | Siehe Abschnitt 5 — keine der bestandenen Gate-3-Punkte wird durch eine reine Layout-Umstellung berührt. |

## 3. Widget-Katalog (Anforderung 1.1.2 „Widget-basiertes Design“)

Analog zum Dashboard-Muster (`W-01`…`W-06`) werden Einstellungs-Widgets mit `S-`-Präfix geführt, damit sie nicht mit Dashboard-IDs kollidieren.

| ID | Widget | Inhalt (unverändert aus heutigem `settings.tsx`) | Pflicht? |
|---|---|---|---|
| S-01 | Konto | Name/Schule (read-only), Kontakt-E-Mail-Eingabe, Verifizierungsstatus, „E-Mail speichern“, „Verifizierungs-Link anfordern“ | **Ja** |
| S-02 | Sicherheit | Abmelden-Aktion (später: Sitzungsübersicht, falls gebaut) | **Ja** |
| S-03 | Darstellung | `ThemeToggle` (Light/Dark/System) | Nein (optional) |

### Warum S-01 und S-02 verpflichtend sind

- **S-01 (Konto):** Die Kontakt-E-Mail- und Verifizierungsfunktion ist eine **verbindliche Produktanforderung** (D-009, POC-05) — ein Nutzer, der dieses Widget ausblendet, verlöre den einzigen Self-Service-Weg zu Recovery/Benachrichtigung ohne Admin-Eingriff. Analog zu W-01 „Mein Campus“ (`doc/design.md`: „kompakter, fester, nicht ausblendbarer Bereich“) wird S-01 **ohne** `WidgetEditControls` gerendert.
- **S-02 (Sicherheit):** Abmelden muss immer erreichbar bleiben; ein ausgeblendetes Abmelden-Widget wäre ein Zugänglichkeits-/Sicherheits-Rückschritt (Konto bliebe angemeldet ohne sichtbaren Ausweg aus den Einstellungen). Gleiches Prinzip wie der nicht abschaltbare, anlassbezogene W-06-Sicherheitshinweis auf dem Dashboard.
- **S-03 (Darstellung)** ist reine Komfort-/Anzeigepräferenz ohne Compliance- oder Sicherheitsbezug und wird daher wie die optionalen Dashboard-Widgets (`W-02`–`W-05`) personalisierbar: Größe (`small`/`large`), Ein-/Ausblenden, „Standard wiederherstellen“.

Keine weiteren Widget-Typen und keine Bibliothek zum Hinzufügen beliebiger neuer Typen — deckungsgleich mit UX-DEC-17 für das Dashboard; Einstellungen bekommen in Foundation v0.1 keinen eigenen, großzügigeren Mechanismus.

## 4. Technische Umsetzung (Vorschlag, noch nicht gebaut)

1. Jeden bestehenden Abschnitt in eine eigene Widget-Komponente extrahieren (`src/components/settings/widgets/AccountWidget.tsx`, `SecurityWidget.tsx`, `AppearanceWidget.tsx`), analog zu `src/components/dashboard/widgets/*`, und über die bestehende `DashboardWidget`-Kapsel (`src/components/ui/DashboardWidget.tsx`) rendern — **keine neue Karten-/Schatten-Implementierung**, dieselbe `Card`-Komponente wie überall sonst.
2. Für S-01/S-02: `DashboardWidget` **ohne** `controls`-Prop (fest, nicht personalisierbar) — identisches Muster zu W-01 im Dashboard.
3. Für S-03: dasselbe Lokal-Persistenz-Muster wie im Dashboard (`AsyncStorage`, eigener Key z. B. `campus.settingsWidgets.v1`, eigene `reconcile()`-Funktion), **nicht** denselben Storage-Key wie das Dashboard-Layout, um die beiden Personalisierungen nicht gegenseitig zu überschreiben. Dies ist dieselbe bereits dokumentierte Vereinfachung wie beim Dashboard (`src/app/(app)/dashboard.tsx` Kommentar: Geräte-lokal statt serverseitig je Konto) und **kein neuer offener Punkt** — UI_UX_SPECIFICATION.md §6.5 nennt Serverpersistenz als noch offenes Ziel für beide Oberflächen gleichermaßen.
4. „Anpassen“/„Fertig“-Umschalter wie im Dashboard, nur für S-03 wirksam (S-01/S-02 zeigen nie Bedienelemente).
5. Keine neuen Supabase-Aufrufe, keine neue Migration — reine Präsentationsschicht-Umstellung.

## 5. Abgleich mit `doc/ACCEPTANCE.md` (Anforderung 1.1.3 / TODO Punkt 3)

- Gate 0–2 (Repo/Auth/Mandantentrennung): nicht berührt, keine Schema-/RLS-/Auth-Änderung.
- Gate 3 „Profile, Schuljahre, Klassen, … und Admin-Basis nutzbar“: Die zugrunde liegenden Datenpfade (`setOwnContactEmail`, `requestOwnEmailVerification`, `signOut`) bleiben fachlich und sicherheitstechnisch unverändert; es wird nur ihre Darstellung neu verpackt. Die bereits bestandene WCAG-Prüfung (M18) muss nach Umsetzung für die Settings-Seite **erneut** stichprobenhaft verifiziert werden (Tab-Reihenfolge, `aria`-Status der neuen Widget-Controls) — gleiche Prüfmethode wie M18, kein neuer Prüfprozess.
- Gate 4 (Produktivfreigabe): nicht betroffen, da kein neuer Datenverarbeitungsweg entsteht.
- **Ergebnis:** Keine bestehende Zeile in `doc/ACCEPTANCE.md` wird durch dieses Konzept invalidiert; die Umsetzung muss diese Prüfung bei Fertigstellung wiederholen, nicht neu erfinden.

## 6. Nicht Teil dieses Konzepts

- Server-seitige Persistenz der Widget-Präferenzen je Konto (offen laut `doc/UI_UX_SPECIFICATION.md`, gilt für Dashboard **und** Settings gleichermaßen — kein settings-spezifischer Rückstand).
- Neue Einstellungs-Inhalte (Benachrichtigungen, Sprache, Datenschutz-Center o. ä.) — nicht in Foundation v0.1 (`doc/DECISIONS.md` D-023).
- Rollenspezifische Settings-Widgets — heutige Settings-Seite ist bereits rollenunabhängig; dieses Konzept ändert das nicht.
