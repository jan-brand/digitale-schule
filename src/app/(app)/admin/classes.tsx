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
import { supabase } from "@/lib/supabase";
import { SchoolMember, listMembers } from "@/features/identity/adminApi";
import {
  ClassLeader,
  RosterMember,
  SchoolClass,
  SchoolYear,
  addClassMember,
  assignClassLeadership,
  createClass,
  listClassLeaders,
  listClassRoster,
  listClasses,
  listSchoolYears,
  removeClassMember,
  revokeClassLeadership,
} from "@/features/academic/academicApi";

// Pressable-chip picker — a full Select component wasn't needed before
// M10 (see doc/README.md M8 notes), so this stays minimal rather than
// pulling in a new component for one screen.
// role="button" + accessibilityState.selected doesn't map to any ARIA
// attribute at all on web (aria-selected isn't valid on a button per
// the ARIA spec, so React Native Web silently drops it) — found via an
// axe-core + manual keyboard audit: Enter/Space visibly toggled the
// selection (background color), but nothing was exposed to a screen
// reader. role="radio"/"radiogroup" is the correct semantics for a
// mutually-exclusive single-select chip group and maps to aria-checked,
// which IS valid for that role.
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
    <View accessibilityRole="radiogroup" style={{ flexDirection: "row", gap: theme.spacing.xs, flexWrap: "wrap" }}>
      {options.map((option) => (
        <Pressable
          key={option.id}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedId === option.id, checked: selectedId === option.id }}
          // React Native Web 0.19 doesn't map accessibilityState.checked
          // to aria-checked for Pressable (verified directly: the DOM
          // attribute stayed null even after a real Enter/Space press
          // visibly toggled the selection) — setting the web ARIA
          // attribute directly is the documented RNWeb escape hatch for
          // exactly this gap.
          aria-checked={selectedId === option.id}
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

function MemberPicker({
  candidates,
  onPick,
}: {
  candidates: { membershipId: string; firstName: string; lastName: string }[];
  onPick: (membershipId: string) => void;
}) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState("");
  const filtered = candidates.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Input label="Suchen" value={filter} onChangeText={setFilter} />
      {filtered.length === 0 ? <Text variant="caption">Keine Treffer.</Text> : null}
      {filtered.slice(0, 10).map((c) => (
        <Pressable
          key={c.membershipId}
          accessibilityRole="button"
          accessibilityLabel={`${c.firstName} ${c.lastName} hinzufügen`}
          onPress={() => onPick(c.membershipId)}
          style={{ paddingVertical: theme.spacing.xs }}
        >
          <Text style={{ color: theme.colors.action }}>{`+ ${c.firstName} ${c.lastName}`}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// SCR-13 (doc/UI_UX_SPECIFICATION.md §5): classes list/form, school
// year, class leadership — extended here to also manage the roster
// (class_memberships, added by this same milestone's migration).
export default function ClassesScreen() {
  const { theme } = useTheme();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newClassName, setNewClassName] = useState("");
  const [newClassYearId, setNewClassYearId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [leaders, setLeaders] = useState<ClassLeader[]>([]);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([listClasses(), listSchoolYears(), listMembers()])
      .then(([classRows, yearRows, memberRows]) => {
        setClasses(classRows);
        setYears(yearRows);
        setMembers(memberRows);
      })
      .catch(() => setError("Daten konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  const reloadDetail = useCallback((classId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    Promise.all([listClassLeaders(classId), listClassRoster(classId)])
      .then(([leaderRows, rosterRows]) => {
        setLeaders(leaderRows);
        setRoster(rosterRows);
      })
      .catch(() => setDetailError("Klassendetails konnten nicht geladen werden."))
      .finally(() => setDetailLoading(false));
  }, []);

  useEffect(() => {
    if (selectedClassId) reloadDetail(selectedClassId);
  }, [selectedClassId, reloadDetail]);

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;

  const teacherCandidates = useMemo(
    () =>
      members
        .filter((m) => m.roles.includes("teacher") && !leaders.some((l) => l.membershipId === m.membershipId))
        .map((m) => ({ membershipId: m.membershipId, firstName: m.firstName, lastName: m.lastName })),
    [members, leaders],
  );
  const studentCandidates = useMemo(
    () =>
      members
        .filter((m) => m.roles.includes("student") && !roster.some((r) => r.membershipId === m.membershipId))
        .map((m) => ({ membershipId: m.membershipId, firstName: m.firstName, lastName: m.lastName })),
    [members, roster],
  );

  async function handleCreateClass() {
    if (!newClassYearId) return;
    setCreateError(null);
    setCreating(true);
    try {
      await createClass(newClassName, newClassYearId);
      setNewClassName("");
      reload();
    } catch {
      setCreateError("Klasse konnte nicht angelegt werden. Bitte Berechtigung und Angaben prüfen.");
    } finally {
      setCreating(false);
    }
  }

  // class_staff_assignments/class_memberships both require school_id on
  // insert. Reading it back off the already-selected class (rather than
  // trusting any client-held value) keeps this correct even if that
  // ever changes; RLS re-checks the real authorization on write either
  // way.
  async function getClassSchoolId(classId: string): Promise<string> {
    const { data } = await supabase.from("classes").select("school_id").eq("id", classId).maybeSingle();
    return data?.school_id ?? "";
  }

  async function handleAddLeader(membershipId: string) {
    if (!selectedClassId) return;
    setDetailError(null);
    try {
      const schoolId = await getClassSchoolId(selectedClassId);
      await assignClassLeadership(selectedClassId, schoolId, membershipId);
      reloadDetail(selectedClassId);
    } catch {
      setDetailError("Klassenleitung konnte nicht zugewiesen werden.");
    }
  }

  async function handleRevokeLeader(assignmentId: string) {
    if (!selectedClassId) return;
    setDetailError(null);
    try {
      await revokeClassLeadership(assignmentId);
      reloadDetail(selectedClassId);
    } catch {
      setDetailError("Klassenleitung konnte nicht beendet werden.");
    }
  }

  async function handleAddStudent(membershipId: string) {
    if (!selectedClassId) return;
    setDetailError(null);
    try {
      const schoolId = await getClassSchoolId(selectedClassId);
      await addClassMember(selectedClassId, schoolId, membershipId);
      reloadDetail(selectedClassId);
    } catch {
      setDetailError("Schüler konnte nicht zur Klasse hinzugefügt werden.");
    }
  }

  async function handleRemoveStudent(classMembershipId: string) {
    if (!selectedClassId) return;
    setDetailError(null);
    try {
      await removeClassMember(classMembershipId);
      reloadDetail(selectedClassId);
    } catch {
      setDetailError("Schüler konnte nicht aus der Klasse entfernt werden.");
    }
  }

  return (
    <Screen scroll title="Klassen">
      <Text variant="title">Klassen</Text>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text variant="body">Neue Klasse</Text>
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
          <Input label="Name (z. B. 10a)" value={newClassName} onChangeText={setNewClassName} />
          <Text variant="caption">Schuljahr</Text>
          <ChipPicker
            options={years.map((y) => ({ id: y.id, label: y.name }))}
            selectedId={newClassYearId}
            onSelect={setNewClassYearId}
          />
          <Button
            label="Anlegen"
            onPress={handleCreateClass}
            loading={creating}
            disabled={!newClassName.trim() || !newClassYearId}
          />
          {createError ? <Text style={{ color: "#D92D20" }}>{createError}</Text> : null}
        </View>
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={reload} /> : null}
        {!loading && !error && classes.length === 0 ? <EmptyState message="Keine Klassen angelegt." /> : null}
        {!loading && !error
          ? classes.map((c) => (
              <Card key={c.id} style={{ marginBottom: theme.spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>{c.name}</Text>
                  <Button
                    label={selectedClassId === c.id ? "Ausgewählt" : "Verwalten"}
                    variant="secondary"
                    onPress={() => setSelectedClassId(c.id)}
                  />
                </View>
              </Card>
            ))
          : null}
      </View>

      {selectedClass ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Text variant="title" style={{ marginBottom: theme.spacing.sm }}>
            {`Klasse ${selectedClass.name}`}
          </Text>
          {detailLoading ? <LoadingState /> : null}
          {detailError ? <Text style={{ color: "#D92D20" }}>{detailError}</Text> : null}

          {!detailLoading ? (
            <>
              <Card style={{ marginBottom: theme.spacing.md }}>
                <Text variant="body" style={{ marginBottom: theme.spacing.sm }}>
                  Klassenleitung
                </Text>
                {leaders.length === 0 ? <EmptyState message="Keine Klassenleitung zugewiesen." /> : null}
                {leaders.map((leader) => (
                  <View
                    key={leader.assignmentId}
                    style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.xs }}
                  >
                    <View style={{ flexDirection: "row", gap: theme.spacing.xs, alignItems: "center" }}>
                      <Badge label="Klassenleitung" tone="success" />
                      <Text>{`${leader.firstName} ${leader.lastName}`}</Text>
                    </View>
                    <Button label="Beenden" variant="secondary" onPress={() => handleRevokeLeader(leader.assignmentId)} />
                  </View>
                ))}
                <Text variant="caption" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                  Lehrkraft zuweisen
                </Text>
                <MemberPicker candidates={teacherCandidates} onPick={handleAddLeader} />
              </Card>

              <Card>
                <Text variant="body" style={{ marginBottom: theme.spacing.sm }}>
                  Klassenliste
                </Text>
                {roster.length === 0 ? <EmptyState message="Keine Schüler zugeordnet." /> : null}
                {roster.map((member) => (
                  <View
                    key={member.classMembershipId}
                    style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.xs }}
                  >
                    <Text>{`${member.firstName} ${member.lastName}`}</Text>
                    <Button
                      label="Entfernen"
                      variant="secondary"
                      onPress={() => handleRemoveStudent(member.classMembershipId)}
                    />
                  </View>
                ))}
                <Text variant="caption" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                  Schüler hinzufügen
                </Text>
                <MemberPicker candidates={studentCandidates} onPick={handleAddStudent} />
              </Card>
            </>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}
