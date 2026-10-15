import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import {
  PermissionCatalogEntry,
  PermissionGrant,
  SchoolMember,
  grantPermission,
  listMembers,
  listPermissionCatalog,
  listPermissionGrants,
  revokePermission,
} from "@/features/identity/adminApi";

// SCR-11 (doc/UI_UX_SPECIFICATION.md §5): roles/delegations, limits
// shown, mandatory reason, audit confirmation. The actual authorization
// rule (D-018) is enforced server-side in fn_grant_permission/
// fn_revoke_permission — only principal can delegate unconditionally;
// a school_admin needs 'permissions.grant' already granted to them.
// This screen surfaces that limit in text rather than hiding it, since
// a plain school_admin attempting a grant will get a real server
// rejection either way.
export default function PermissionsScreen() {
  const { theme } = useTheme();
  const [grants, setGrants] = useState<PermissionGrant[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogEntry[]>([]);
  const [members, setMembers] = useState<SchoolMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [memberFilter, setMemberFilter] = useState("");
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);
  const [selectedPermissionCode, setSelectedPermissionCode] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<PermissionGrant | null>(null);
  const [confirmingGrant, setConfirmingGrant] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([listPermissionGrants(), listPermissionCatalog(), listMembers()])
      .then(([g, c, m]) => {
        setGrants(g);
        setCatalog(c);
        setMembers(m);
      })
      .catch(() => setError("Daten konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  const memberCandidates = useMemo(
    () =>
      members.filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberFilter.toLowerCase())),
    [members, memberFilter],
  );
  const selectedMember = members.find((m) => m.membershipId === selectedMembershipId) ?? null;

  async function handleGrant(reason?: string) {
    if (!selectedMembershipId || !selectedPermissionCode) return;
    setActionError(null);
    try {
      await grantPermission(selectedMembershipId, selectedPermissionCode, reason ?? "");
      setSelectedMembershipId(null);
      setSelectedPermissionCode(null);
      setMemberFilter("");
      reload();
    } catch {
      setActionError(
        "Vergabe fehlgeschlagen. Nur die Schulleitung kann uneingeschränkt delegieren — ein Schuladmin braucht dafür selbst bereits das Recht 'permissions.grant'.",
      );
    } finally {
      setConfirmingGrant(false);
    }
  }

  async function handleRevoke(reason?: string) {
    if (!pendingRevoke) return;
    setActionError(null);
    try {
      await revokePermission(pendingRevoke.id, reason ?? "");
      reload();
    } catch {
      setActionError("Entzug fehlgeschlagen. Bitte Berechtigung prüfen.");
    } finally {
      setPendingRevoke(null);
    }
  }

  return (
    <Screen scroll>
      <Text variant="title">Berechtigungen</Text>
      <Text variant="caption" style={{ marginTop: theme.spacing.xs }}>
        Nur die Schulleitung kann uneingeschränkt delegieren. Ein Schuladmin braucht dafür selbst bereits das Recht
        „permissions.grant", sonst schlägt die Vergabe fehl — keine Selbstvergabe möglich.
      </Text>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text variant="body">Neue Delegation</Text>
        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
          <Input label="Mitglied suchen" value={memberFilter} onChangeText={setMemberFilter} />
          {!selectedMembershipId ? (
            <View style={{ gap: theme.spacing.xs }}>
              {memberCandidates.slice(0, 8).map((m) => (
                <Pressable
                  key={m.membershipId}
                  accessibilityRole="button"
                  onPress={() => setSelectedMembershipId(m.membershipId)}
                  style={{ paddingVertical: theme.spacing.xs }}
                >
                  <Text style={{ color: theme.colors.action }}>{`${m.firstName} ${m.lastName}`}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text>{`Ausgewählt: ${selectedMember?.firstName} ${selectedMember?.lastName}`}</Text>
              <Button label="Ändern" variant="secondary" onPress={() => setSelectedMembershipId(null)} />
            </View>
          )}

          <Text variant="caption">Berechtigung</Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.xs, flexWrap: "wrap" }}>
            {catalog.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedPermissionCode === p.code }}
                onPress={() => setSelectedPermissionCode(p.code)}
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.action,
                  borderRadius: theme.radius.card,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  backgroundColor: selectedPermissionCode === p.code ? theme.colors.action : "transparent",
                }}
              >
                <Text style={{ color: selectedPermissionCode === p.code ? theme.colors.surface : theme.colors.action }}>
                  {p.code}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            label="Delegieren"
            onPress={() => setConfirmingGrant(true)}
            disabled={!selectedMembershipId || !selectedPermissionCode}
          />
        </View>
      </Card>

      {actionError ? <Text style={{ color: "#D92D20", marginTop: theme.spacing.md }}>{actionError}</Text> : null}

      <View style={{ marginTop: theme.spacing.lg }}>
        <Text variant="body" style={{ marginBottom: theme.spacing.sm }}>
          Aktive Delegationen
        </Text>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={reload} /> : null}
        {!loading && !error && grants.length === 0 ? (
          <EmptyState message="Keine aktiven Delegationen." />
        ) : null}
        {!loading && !error
          ? grants.map((g) => (
              <Card key={g.id} style={{ marginBottom: theme.spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", gap: theme.spacing.xs, alignItems: "center" }}>
                      <Badge label={g.permissionCode} />
                      <Text>{`${g.firstName} ${g.lastName}`}</Text>
                    </View>
                    <Text variant="caption">{g.reason}</Text>
                  </View>
                  <Button label="Entziehen" variant="danger" onPress={() => setPendingRevoke(g)} />
                </View>
              </Card>
            ))
          : null}
      </View>

      <ConfirmDialog
        visible={confirmingGrant}
        title="Delegation bestätigen"
        message={`${selectedMember?.firstName} ${selectedMember?.lastName} erhält "${selectedPermissionCode}".`}
        requireReason
        confirmLabel="Delegieren"
        onConfirm={handleGrant}
        onCancel={() => setConfirmingGrant(false)}
      />

      <ConfirmDialog
        visible={pendingRevoke !== null}
        title="Delegation entziehen"
        message={pendingRevoke ? `${pendingRevoke.firstName} ${pendingRevoke.lastName} — ${pendingRevoke.permissionCode}` : ""}
        requireReason
        destructive
        confirmLabel="Entziehen"
        onConfirm={handleRevoke}
        onCancel={() => setPendingRevoke(null)}
      />
    </Screen>
  );
}
