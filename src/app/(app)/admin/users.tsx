import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import {
  SchoolMember,
  inviteUser,
  listMembers,
  reactivateMembership,
  suspendMembership,
} from "@/features/identity/adminApi";

// Minimal but real M4 admin screen: list members (RLS-scoped to the
// admin's own school, see adminApi.listMembers), invite a new member,
// suspend/reactivate a membership. Reusable DataTable/Dialog components
// (M8) don't exist yet — plain list rows for now, not a placeholder.
// Reachable only by school_admin/principal in practice: every action
// here calls a SECURITY DEFINER function that re-checks the caller's
// standing itself, so a non-admin visiting this screen directly can look
// but every action will be rejected server-side regardless of this UI.
export default function AdminUsersScreen() {
  const { theme } = useTheme();
  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMembers(await listMembers());
    } catch {
      setError("Mitglieder konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleInvite() {
    setActionError(null);
    setInviteResult(null);
    setInviting(true);
    try {
      const result = await inviteUser({
        firstName,
        lastName,
        roleCode: "student",
        reason: "Einladung über die Benutzerverwaltung",
      });
      setInviteResult(
        `Benutzername: ${result.username}` +
          (result.initialPassword ? ` · Erstes Passwort: ${result.initialPassword}` : ""),
      );
      setFirstName("");
      setLastName("");
      await reload();
    } catch {
      setActionError("Einladung fehlgeschlagen. Bitte Berechtigung und Angaben prüfen.");
    } finally {
      setInviting(false);
    }
  }

  async function handleToggleStatus(member: SchoolMember) {
    setActionError(null);
    try {
      if (member.status === "active") {
        await suspendMembership(member.membershipId, "Über die Benutzerverwaltung gesperrt");
      } else {
        await reactivateMembership(member.membershipId, "Über die Benutzerverwaltung reaktiviert");
      }
      await reload();
    } catch {
      setActionError("Aktion fehlgeschlagen. Bitte Berechtigung prüfen.");
    }
  }

  return (
    <Screen scroll>
      <Text variant="title">Benutzerverwaltung</Text>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text variant="body">Neues Mitglied einladen</Text>
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
          <Input label="Vorname" value={firstName} onChangeText={setFirstName} />
          <Input label="Nachname" value={lastName} onChangeText={setLastName} />
          <Button
            label="Einladen (als Schüler)"
            onPress={handleInvite}
            loading={inviting}
            disabled={!firstName.trim() || !lastName.trim()}
          />
          {inviteResult ? <Text variant="caption">{inviteResult}</Text> : null}
        </View>
      </Card>

      {actionError ? (
        <Text style={{ color: "#D92D20", marginTop: theme.spacing.md }}>{actionError}</Text>
      ) : null}

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Text variant="body">Mitglieder</Text>
        {loading ? <Text variant="caption">Lädt…</Text> : null}
        {error ? <Text style={{ color: "#D92D20" }}>{error}</Text> : null}
        {!loading && !error && members.length === 0 ? (
          <Text variant="caption">Keine Mitglieder gefunden.</Text>
        ) : null}
        {members.map((member) => (
          <Card key={member.membershipId} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text>
                {member.firstName} {member.lastName}
              </Text>
              <Text variant="caption">
                {member.roles.join(", ") || "keine Rolle"} · {member.status}
              </Text>
            </View>
            <Button
              label={member.status === "active" ? "Sperren" : "Reaktivieren"}
              variant="secondary"
              onPress={() => handleToggleStatus(member)}
            />
          </Card>
        ))}
      </View>
    </Screen>
  );
}
