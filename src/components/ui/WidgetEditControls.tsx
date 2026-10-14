import { View } from "react-native";
import { Button } from "./Button";
import { useTheme } from "@/providers/ThemeProvider";
import { WidgetSize } from "./DashboardWidget";

interface WidgetEditControlsProps {
  size: WidgetSize;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleSize: () => void;
  onHide: () => void;
}

// doc/UI_UX_SPECIFICATION.md §6.5: "Nach oben/unten verschieben",
// "Größe wählen", ausblenden — accessible button controls, not
// drag-and-drop-only (keyboard/screen-reader equivalent is mandatory,
// drag-and-drop itself is optional and not built here).
export function WidgetEditControls({
  size,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggleSize,
  onHide,
}: WidgetEditControlsProps) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
      <Button label="▲" accessibilityLabel="Nach oben verschieben" variant="secondary" disabled={!canMoveUp} onPress={onMoveUp} />
      <Button label="▼" accessibilityLabel="Nach unten verschieben" variant="secondary" disabled={!canMoveDown} onPress={onMoveDown} />
      <Button
        label={size === "small" ? "Groß" : "Klein"}
        accessibilityLabel={size === "small" ? "Groß darstellen" : "Klein darstellen"}
        variant="secondary"
        onPress={onToggleSize}
      />
      <Button label="Ausblenden" variant="secondary" onPress={onHide} />
    </View>
  );
}
