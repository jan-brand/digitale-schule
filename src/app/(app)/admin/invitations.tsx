import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import {
  Invitation,
  RoleCode,
  listInvitations,
  reactivateMembership,
  suspendMembership,
} from "@/features/identity/adminApi";

// SCR-09 (doc/UI_UX_SPECIFICATION.md): "Einladung erstellen, widerrufen,
// Status, Ablauf". Erstellen passiert bereits in admin/users.tsx
// ("Mitglied einladen"). Dieser Screen ist bewusst eine reine Historie,
// kein eigener Erstell-Formular-Doppelgänger — siehe
// 20261016000001_m19_invitation_lifecycle.sql für die Architektur-
// entscheidung: Das in der IAM-Doku beschriebene asynchrone Einladungs-
// Token-Verfahren (E-Mail-Versand, "pending" bis zum Klick) wurde nie
// gebaut, weil es ohne echten SMTP-Versand und mit dem tatsächlich
// umgesetzten Benutzername/Passwort-Auth-Modell keinen funktionierenden
// Zustellweg hätte. "Widerrufen" einer bereits abgeschlossenen
// Einladung ergibt deshalb hier keinen Sinn — was stattdessen zählt
// (und was diese Liste als "Status" zeigt), ist der aktuelle Zustand
// der daraus entstandenen Mitgliedschaft, mit Sperren/Reaktivieren als
// Aktion statt eines nicht-anwendbaren "Einladung widerrufen".
const ROLE_LABELS: Record<RoleCode, string> = {
  student: "Schüler",
  teacher: "Lehrkraft",
  parent: "Eltern",
  secretariat: "Sekretariat",
  school_admin: "Schuladmin",
  principal: "Schulleitung",
};

interface PendingAction {
  invitation: Invitation;
  nextStatus: "active" | "suspended";
}

export default function InvitationsScreen() {
  const { theme } = useTheme();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    listInvitations()
      .then(setInvitations)
      .catch(() => setError("Einladungen konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  async function handleConfirm(reason?: string) {
    if (!pendingAction?.invitation.membershipId) return;
    setActionError(null);
    try {
      if (pendingAction.nextStatus === "suspended") {
        await suspendMembership(pendingAction.invitation.membershipId, reason ?? "Über die Einladungshistorie gesperrt");
      } else {
        await reactivateMembership(pendingAction.invitation.membershipId, reason ?? "Über die Einladungshistorie reaktiviert");
      }
      setPendingAction(null);
      reload();
    } catch {
      setActionError("Aktion konnte nicht ausgeführt werden.");
      setPendingAction(null);
    }
  }

  return (
    <Screen scroll title="Einladungen">
      <Text variant="title">Einladungen</Text>
      <Text variant="caption" style={{ marginTop: theme.spacing.xs }}>
        Verlauf der über „Mitglied einladen" (admin/users) erstellten Konten dieser Schule, mit dem aktuellen Status
        der jeweiligen Mitgliedschaft.
      </Text>

      <View style={{ marginTop: theme.spacing.lg }}>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={reload} /> : null}
        {!loading && !error && invitations.length === 0 ? (
          <EmptyState message="Noch keine Einladungen ausgesprochen." />
        ) : null}
        {actionError ? <Text style={{ color: "#D92D20" }}>{actionError}</Text> : null}
        {!loading && !error
          ? invitations.map((inv) => (
              <Card key={inv.id} style={{ marginBottom: theme.spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text>{inv.invitedIdentityHint}</Text>
                  {inv.membershipStatus ? (
                    <Badge
                      label={inv.membershipStatus === "active" ? "aktiv" : inv.membershipStatus}
                      tone={inv.membershipStatus === "active" ? "success" : "danger"}
                    />
                  ) : null}
                </View>
                <Text variant="caption">
                  {inv.proposedRoleCodes.map((r) => ROLE_LABELS[r] ?? r).join(", ")} ·{" "}
                  {new Date(inv.createdAt).toLocaleString("de-DE")}
                </Text>
                {inv.membershipId ? (
                  <View style={{ marginTop: theme.spacing.sm }}>
                    <Button
                      label={inv.membershipStatus === "active" ? "Sperren" : "Reaktivieren"}
                      variant="secondary"
                      onPress={() =>
                        setPendingAction({
                          invitation: inv,
                          nextStatus: inv.membershipStatus === "active" ? "suspended" : "active",
                        })
                      }
                    />
                  </View>
                ) : null}
              </Card>
            ))
          : null}
      </View>

      <ConfirmDialog
        visible={pendingAction !== null}
        title={pendingAction?.nextStatus === "suspended" ? "Mitgliedschaft sperren" : "Mitgliedschaft reaktivieren"}
        message={pendingAction ? pendingAction.invitation.invitedIdentityHint : ""}
        requireReason
        destructive={pendingAction?.nextStatus === "suspended"}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </Screen>
  );
}
