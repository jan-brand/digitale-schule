import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { ResponsiveDataList } from "@/components/layout/ResponsiveDataList";
import {
  SchoolMember,
  inviteUser,
  issueTeacherResetCode,
  listMembers,
  reactivateMembership,
  suspendMembership,
} from "@/features/identity/adminApi";

type PendingAction =
  | { kind: "toggle-status"; member: SchoolMember }
  | { kind: "reset-code"; member: SchoolMember };

// M4 admin screen, retrofitted in M8 onto the shared component set
// (ResponsiveDataList, ConfirmDialog, Badge, Loading/Error states) —
// every action still calls the same SECURITY DEFINER functions that
// re-check the caller's standing themselves; nothing about the
// authorization boundary changed here, only the presentation.
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

  const [resetCodeResult, setResetCodeResult] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

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

  async function handleConfirmPendingAction(reason?: string) {
    if (!pendingAction) return;
    setActionError(null);
    try {
      if (pendingAction.kind === "toggle-status") {
        const { member } = pendingAction;
        if (member.status === "active") {
          await suspendMembership(member.membershipId, reason ?? "Über die Benutzerverwaltung gesperrt");
        } else {
          await reactivateMembership(member.membershipId, reason ?? "Über die Benutzerverwaltung reaktiviert");
        }
        await reload();
      } else {
        const code = await issueTeacherResetCode(
          pendingAction.member.profileId,
          reason ?? "Passwort-Reset über die Benutzerverwaltung angefordert",
        );
        setResetCodeResult(
          `Code für ${pendingAction.member.firstName} ${pendingAction.member.lastName}: ${code} (einmalig gültig, 30 Minuten) — bitte persönlich weitergeben, nie per E-Mail.`,
        );
      }
    } catch {
      setActionError("Aktion fehlgeschlagen. Bitte Berechtigung prüfen.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <Screen scroll title="Mitglieder">
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
      {resetCodeResult ? (
        <Text variant="caption" style={{ marginTop: theme.spacing.sm }}>
          {resetCodeResult}
        </Text>
      ) : null}

      <View style={{ marginTop: theme.spacing.lg }}>
        <Text variant="body" style={{ marginBottom: theme.spacing.sm }}>
          Mitglieder
        </Text>
        {loading ? <LoadingState label="Mitglieder werden geladen…" /> : null}
        {error ? <ErrorState message={error} onRetry={reload} /> : null}
        {!loading && !error ? (
          <ResponsiveDataList
            rows={members}
            rowKey={(m) => m.membershipId}
            emptyMessage="Keine Mitglieder gefunden."
            columns={[
              {
                key: "name",
                header: "Name",
                render: (m) => <Text>{`${m.firstName} ${m.lastName}`}</Text>,
              },
              {
                key: "roles",
                header: "Rollen",
                render: (m) => (
                  <View style={{ flexDirection: "row", gap: theme.spacing.xs, flexWrap: "wrap" }}>
                    {m.roles.length === 0 ? <Text variant="caption">keine Rolle</Text> : null}
                    {m.roles.map((role) => (
                      <Badge key={role} label={role} />
                    ))}
                  </View>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (m) => (
                  <Badge label={m.status} tone={m.status === "active" ? "success" : "warning"} />
                ),
              },
            ]}
            renderActions={(member) => (
              <>
                {member.roles.includes("student") ? (
                  <Button
                    label="Reset-Code"
                    variant="secondary"
                    onPress={() => setPendingAction({ kind: "reset-code", member })}
                  />
                ) : null}
                <Button
                  label={member.status === "active" ? "Sperren" : "Reaktivieren"}
                  variant={member.status === "active" ? "danger" : "secondary"}
                  onPress={() => setPendingAction({ kind: "toggle-status", member })}
                />
              </>
            )}
          />
        ) : null}
      </View>

      <ConfirmDialog
        visible={pendingAction !== null}
        title={
          pendingAction?.kind === "reset-code"
            ? "Reset-Code erzeugen"
            : pendingAction?.member.status === "active"
              ? "Mitgliedschaft sperren"
              : "Mitgliedschaft reaktivieren"
        }
        message={
          pendingAction
            ? `${pendingAction.member.firstName} ${pendingAction.member.lastName}`
            : ""
        }
        requireReason
        destructive={pendingAction?.kind === "toggle-status" && pendingAction.member.status === "active"}
        confirmLabel="Bestätigen"
        onConfirm={handleConfirmPendingAction}
        onCancel={() => setPendingAction(null)}
      />
    </Screen>
  );
}
