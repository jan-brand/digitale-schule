import { View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";

const ACTIVE_MODULES = [
  { name: "Benutzerverwaltung", description: "Mitglieder einladen, sperren, reaktivieren, Berechtigungen delegieren." },
  { name: "CSV-Import", description: "Mehrere Mitglieder per CSV-Datei anlegen." },
  { name: "Schulorganisation", description: "Schuljahre, Klassen, Fächer, Kurse." },
  { name: "Dashboard", description: "Rollenabhängige Widgets, Klassenleitung und Kurszuordnungen." },
];

// SCR-16 (doc/UI_UX_SPECIFICATION.md §5/§6.7): "Aktivierte Module;
// spätere Module nur als nicht verfügbar kennzeichnen, keine
// Scheinfunktion." Foundation v0.1 has no optional/togglable Fachmodul
// yet — module_settings exists in the schema for that future purpose,
// but nothing reads it to gate behavior today. Exposing a toggle UI for
// it right now would itself be exactly the "Scheinfunktion" (fake
// function with no real effect) this screen is supposed to avoid, so
// this is a read-only overview of what's actually active, not a
// module_settings editor.
export default function ModulesScreen() {
  const { theme } = useTheme();
  return (
    <Screen scroll title="Module">
      <Text variant="title">Module</Text>
      <Text variant="caption" style={{ marginTop: theme.spacing.xs }}>
        Foundation v0.1 hat noch keine optionalen Fachmodule zum Ein-/Ausschalten — die folgenden sind fest aktiv.
      </Text>

      <View style={{ marginTop: theme.spacing.lg }}>
        {ACTIVE_MODULES.map((m) => (
          <Card key={m.name} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: "row", gap: theme.spacing.xs, alignItems: "center" }}>
              <Badge label="Aktiv" tone="success" />
              <Text>{m.name}</Text>
            </View>
            <Text variant="caption">{m.description}</Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
