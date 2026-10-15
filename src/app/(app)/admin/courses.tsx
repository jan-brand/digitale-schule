import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { SchoolMember, listMembers } from "@/features/identity/adminApi";
import {
  Course,
  CourseMember,
  SchoolYear,
  Subject,
  addCourseMember,
  createCourse,
  listCourseMembers,
  listCourses,
  listSchoolYears,
  listSubjects,
  removeCourseMember,
} from "@/features/academic/academicApi";

// Same minimal chip-picker as admin/classes.tsx — one more use case
// still doesn't justify a shared Select component (see doc/README.md
// M8 notes).
function ChipPicker<T extends { id: string; label: string }>({
  options,
  selectedId,
  onSelect,
}: {
  options: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: theme.spacing.xs, flexWrap: "wrap" }}>
      {options.map((option) => (
        <Pressable
          key={option.id}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedId === option.id }}
          onPress={() => onSelect(option.id)}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.action,
            borderRadius: theme.radius.card,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
            backgroundColor: selectedId === option.id ? theme.colors.action : "transparent",
          }}
        >
          <Text style={{ color: selectedId === option.id ? theme.colors.surface : theme.colors.action }}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// SCR-15 (doc/UI_UX_SPECIFICATION.md §5): courses list/form with
// subject+school-year assignment, plus roster management
// (course_memberships — the same table M9's dashboard widget reads
// from for "Meine Zuordnungen").
export default function CoursesScreen() {
  const { theme } = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseSubjectId, setNewCourseSubjectId] = useState<string | null>(null);
  const [newCourseYearId, setNewCourseYearId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [roster, setRoster] = useState<CourseMember[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState("");

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([listCourses(), listSubjects(), listSchoolYears(), listMembers()])
      .then(([c, s, y, m]) => {
        setCourses(c);
        setSubjects(s);
        setYears(y);
        setMembers(m);
      })
      .catch(() => setError("Daten konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  const reloadRoster = useCallback((courseId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    listCourseMembers(courseId)
      .then(setRoster)
      .catch(() => setDetailError("Kursmitglieder konnten nicht geladen werden."))
      .finally(() => setDetailLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCourseId) reloadRoster(selectedCourseId);
  }, [selectedCourseId, reloadRoster]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;
  const memberCandidates = useMemo(
    () =>
      members
        .filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberFilter.toLowerCase()))
        .filter((m) => !roster.some((r) => r.id === m.membershipId)),
    [members, memberFilter, roster],
  );

  async function handleCreateCourse() {
    if (!newCourseSubjectId || !newCourseYearId) return;
    setCreateError(null);
    setCreating(true);
    try {
      await createCourse(newCourseName, newCourseSubjectId, newCourseYearId);
      setNewCourseName("");
      reload();
    } catch {
      setCreateError("Kurs konnte nicht angelegt werden. Bitte Berechtigung und Angaben prüfen.");
    } finally {
      setCreating(false);
    }
  }

  async function handleAddMember(member: SchoolMember, role: "student" | "teacher") {
    if (!selectedCourseId) return;
    setDetailError(null);
    try {
      // course_memberships needs both membership_id and user_id;
      // SchoolMember.profileId is the same uuid as auth.users.id
      // (profiles.id references auth.users directly).
      await addCourseMember(selectedCourseId, member.membershipId, member.profileId, role);
      reloadRoster(selectedCourseId);
    } catch {
      setDetailError("Mitglied konnte nicht hinzugefügt werden.");
    }
  }

  async function handleRemoveMember(id: string) {
    if (!selectedCourseId) return;
    setDetailError(null);
    try {
      await removeCourseMember(id);
      reloadRoster(selectedCourseId);
    } catch {
      setDetailError("Mitglied konnte nicht entfernt werden.");
    }
  }

  return (
    <Screen scroll>
      <Text variant="title">Kurse</Text>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text variant="body">Neuer Kurs</Text>
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
          <Input label="Name (z. B. Mathematik 10a)" value={newCourseName} onChangeText={setNewCourseName} />
          <Text variant="caption">Fach</Text>
          <ChipPicker
            options={subjects.map((s) => ({ id: s.id, label: s.name }))}
            selectedId={newCourseSubjectId}
            onSelect={setNewCourseSubjectId}
          />
          <Text variant="caption">Schuljahr</Text>
          <ChipPicker
            options={years.map((y) => ({ id: y.id, label: y.name }))}
            selectedId={newCourseYearId}
            onSelect={setNewCourseYearId}
          />
          <Button
            label="Anlegen"
            onPress={handleCreateCourse}
            loading={creating}
            disabled={!newCourseName.trim() || !newCourseSubjectId || !newCourseYearId}
          />
          {createError ? <Text style={{ color: "#D92D20" }}>{createError}</Text> : null}
        </View>
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={reload} /> : null}
        {!loading && !error && courses.length === 0 ? <EmptyState message="Keine Kurse angelegt." /> : null}
        {!loading && !error
          ? courses.map((c) => (
              <Card key={c.id} style={{ marginBottom: theme.spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>{c.name}</Text>
                  <Button
                    label={selectedCourseId === c.id ? "Ausgewählt" : "Verwalten"}
                    variant="secondary"
                    onPress={() => setSelectedCourseId(c.id)}
                  />
                </View>
              </Card>
            ))
          : null}
      </View>

      {selectedCourse ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Text variant="title" style={{ marginBottom: theme.spacing.sm }}>
            {`Kurs ${selectedCourse.name}`}
          </Text>
          {detailLoading ? <LoadingState /> : null}
          {detailError ? <Text style={{ color: "#D92D20" }}>{detailError}</Text> : null}

          {!detailLoading ? (
            <Card>
              <Text variant="body" style={{ marginBottom: theme.spacing.sm }}>
                Kursmitglieder
              </Text>
              {roster.length === 0 ? <EmptyState message="Keine Mitglieder zugeordnet." /> : null}
              {roster.map((r) => (
                <View
                  key={r.id}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.xs }}
                >
                  <View style={{ flexDirection: "row", gap: theme.spacing.xs, alignItems: "center" }}>
                    <Badge label={r.participantRole === "teacher" ? "Lehrkraft" : "Schüler"} />
                    <Text>{`${r.firstName} ${r.lastName}`}</Text>
                  </View>
                  <Button label="Entfernen" variant="secondary" onPress={() => handleRemoveMember(r.id)} />
                </View>
              ))}

              <Text variant="caption" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                Mitglied hinzufügen
              </Text>
              <Input label="Suchen" value={memberFilter} onChangeText={setMemberFilter} />
              <View style={{ gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
                {memberCandidates.slice(0, 8).map((m) => (
                  <View key={m.membershipId} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text>{`${m.firstName} ${m.lastName}`}</Text>
                    <View style={{ flexDirection: "row", gap: theme.spacing.xs }}>
                      <Button label="Als Schüler" variant="secondary" onPress={() => handleAddMember(m, "student")} />
                      <Button label="Als Lehrkraft" variant="secondary" onPress={() => handleAddMember(m, "teacher")} />
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}
