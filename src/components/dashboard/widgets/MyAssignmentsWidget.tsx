import { View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { DashboardWidget, WidgetSize } from "@/components/ui/DashboardWidget";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { useMyAssignments } from "@/features/dashboard/useMyAssignments";

// W-03 "Meine Zuordnungen" (doc/UI_UX_SPECIFICATION.md §6.2/§6.3) —
// real own course_memberships + active class_staff_assignments only.
// No invented timetable/grades/homework (§6.7: those modules don't
// exist in Foundation v0.1).
export function MyAssignmentsWidget({
  membershipId,
  size,
  controls,
}: {
  membershipId: string;
  size: WidgetSize;
  controls?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const { courses, classLeaderships, loading, error } = useMyAssignments(membershipId);

  const hasContent = courses.length > 0 || classLeaderships.length > 0;

  return (
    <DashboardWidget title="Meine Zuordnungen" size={size} controls={controls}>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && !hasContent ? (
        <EmptyState message="Keine Kurse oder Klassenleitungen zugeordnet." />
      ) : null}
      {!loading && !error && hasContent ? (
        <View style={{ gap: theme.spacing.xs }}>
          {classLeaderships.map((c) => (
            <View key={c.id} style={{ flexDirection: "row", gap: theme.spacing.xs, alignItems: "center" }}>
              <Badge label="Klassenleitung" tone="success" />
              <Text>{c.className}</Text>
            </View>
          ))}
          {courses.map((c) => (
            <View key={c.id} style={{ flexDirection: "row", gap: theme.spacing.xs, alignItems: "center" }}>
              <Badge label={c.role === "teacher" ? "Lehrkraft" : "Schüler"} />
              <Text>{`${c.courseName}${c.subjectName ? ` (${c.subjectName})` : ""}`}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </DashboardWidget>
  );
}
