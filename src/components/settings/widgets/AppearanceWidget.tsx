import { DashboardWidget, WidgetSize } from "@/components/ui/DashboardWidget";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AppearanceWidgetProps {
  size: WidgetSize;
  controls?: React.ReactNode;
}

// S-03 "Darstellung" (doc/SETTINGS_WIDGETS_PLAN.md §3) — reine
// Komfortpräferenz ohne Compliance-/Sicherheitsbezug, daher wie die
// optionalen Dashboard-Widgets personalisierbar (sortieren, Größe
// ändern, aus-/einblenden, zurücksetzen) über `controls`.
export function AppearanceWidget({ size, controls }: AppearanceWidgetProps) {
  return (
    <DashboardWidget title="Darstellung" size={size} controls={controls}>
      <ThemeToggle />
    </DashboardWidget>
  );
}
