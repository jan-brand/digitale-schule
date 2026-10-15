import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { WidgetEditControls } from "@/components/ui/WidgetEditControls";
import { WidgetSize } from "@/components/ui/DashboardWidget";
import { useTheme } from "@/providers/ThemeProvider";
import { useCurrentMember } from "@/features/identity/useCurrentMember";
import { RoleCode } from "@/features/identity/adminApi";
import { MyCampusWidget } from "@/components/dashboard/widgets/MyCampusWidget";
import { MyAccountWidget } from "@/components/dashboard/widgets/MyAccountWidget";
import { MyAssignmentsWidget } from "@/components/dashboard/widgets/MyAssignmentsWidget";
import { AdministrationWidget } from "@/components/dashboard/widgets/AdministrationWidget";
import { ModulesWidget } from "@/components/dashboard/widgets/ModulesWidget";
import { SecurityNoticeWidget, useSecurityNotice } from "@/components/dashboard/widgets/SecurityNoticeWidget";

type WidgetId = "W-02" | "W-03" | "W-04" | "W-05";

interface WidgetPref {
  visible: boolean;
  size: WidgetSize;
}

type Layout = { order: WidgetId[]; prefs: Record<WidgetId, WidgetPref> };

const STORAGE_KEY = "campus.dashboardWidgets.v1";

const ROLE_LABELS: Record<RoleCode, string> = {
  student: "Schüler",
  teacher: "Lehrkraft",
  parent: "Eltern",
  secretariat: "Sekretariat",
  school_admin: "Schuladmin",
  principal: "Schulleitung",
};

function defaultLayout(available: WidgetId[]): Layout {
  const prefs: Record<string, WidgetPref> = {};
  available.forEach((id) => {
    prefs[id] = { visible: true, size: "small" };
  });
  return { order: available, prefs: prefs as Record<WidgetId, WidgetPref> };
}

function reconcile(stored: Layout | null, available: WidgetId[]): Layout {
  const fresh = defaultLayout(available);
  if (!stored) return fresh;
  // doc/UI_UX_SPECIFICATION.md §6.4: widgets no longer authorized (role
  // lost, permission revoked) must disappear from the view, never be
  // kept from a stale local preference.
  const order = stored.order.filter((id) => available.includes(id));
  available.forEach((id) => {
    if (!order.includes(id)) order.push(id);
  });
  const prefs: Record<string, WidgetPref> = {};
  available.forEach((id) => {
    prefs[id] = stored.prefs[id] ?? fresh.prefs[id];
  });
  return { order, prefs: prefs as Record<WidgetId, WidgetPref> };
}

// SCR-04 (doc/UI_UX_SPECIFICATION.md §6): widget-first dashboard, no
// hero block. W-01 and an active W-06 are fixed and outside the
// personalizable list; W-02/W-03/W-04/W-05 are reordered/resized/hidden
// via WidgetEditControls, persisted locally (same device-local pattern
// already used for theme/sidebar — not yet the per-account server
// persistence §6.5 ultimately wants, a documented simplification).
export default function DashboardScreen() {
  const { theme } = useTheme();
  const { member, loading: memberLoading } = useCurrentMember();
  const securityNotice = useSecurityNotice(member);

  const [focusRole, setFocusRole] = useState<RoleCode | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [editMode, setEditMode] = useState(false);

  const availableWidgets = useMemo<WidgetId[]>(() => {
    if (!member) return [];
    const ids: WidgetId[] = ["W-02"];
    if (member.roles.includes("student") || member.roles.includes("teacher")) ids.push("W-03");
    if (member.hasAdminAccess) ids.push("W-04");
    ids.push("W-05");
    return ids;
  }, [member]);

  useEffect(() => {
    if (availableWidgets.length === 0) return;
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const parsed: Layout | null = stored ? JSON.parse(stored) : null;
      setLayout(reconcile(parsed, availableWidgets));
    });
  }, [availableWidgets]);

  function persist(next: Layout) {
    setLayout(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }

  function moveWidget(id: WidgetId, direction: -1 | 1) {
    if (!layout) return;
    const index = layout.order.indexOf(id);
    const target = index + direction;
    if (target < 0 || target >= layout.order.length) return;
    const order = [...layout.order];
    [order[index], order[target]] = [order[target], order[index]];
    persist({ ...layout, order });
  }

  function toggleSize(id: WidgetId) {
    if (!layout) return;
    const current = layout.prefs[id];
    persist({
      ...layout,
      prefs: { ...layout.prefs, [id]: { ...current, size: current.size === "small" ? "large" : "small" } },
    });
  }

  function hideWidget(id: WidgetId) {
    if (!layout) return;
    persist({ ...layout, prefs: { ...layout.prefs, [id]: { ...layout.prefs[id], visible: false } } });
  }

  function showWidget(id: WidgetId) {
    if (!layout) return;
    persist({ ...layout, prefs: { ...layout.prefs, [id]: { ...layout.prefs[id], visible: true } } });
  }

  function restoreDefaults() {
    const fresh = defaultLayout(availableWidgets);
    persist(fresh);
  }

  if (memberLoading || !layout || !member) {
    return (
      <Screen title="Dashboard">
        <LoadingState label="Dashboard wird geladen…" />
      </Screen>
    );
  }

  const hiddenWidgets = layout.order.filter((id) => !layout.prefs[id]?.visible);

  // §6.4: role-view focus only changes which widget gets priority
  // emphasis — never navigation or rights. W-03 shows courses/
  // leaderships for either role regardless, so "focus" here just
  // determines display order weighting for a multi-role account.
  const effectiveOrder =
    focusRole && member.roles.length > 1
      ? [...layout.order].sort((a, b) => {
          const weight = (id: WidgetId) => (id === "W-03" && focusRole === "teacher" ? -1 : 0);
          return weight(a) - weight(b);
        })
      : layout.order;

  return (
    <Screen scroll title="Dashboard">
      <MyCampusWidget />
      {securityNotice ? <SecurityNoticeWidget message={securityNotice} /> : null}

      {member.roles.length > 1 ? (
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text variant="caption" style={{ marginBottom: theme.spacing.xs }}>
            Rollenansicht
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.xs, flexWrap: "wrap" }}>
            {member.roles.map((role) => (
              <Pressable
                key={role}
                accessibilityRole="button"
                accessibilityLabel={`Schwerpunkt ${ROLE_LABELS[role]}`}
                accessibilityState={{ selected: focusRole === role }}
                onPress={() => setFocusRole(focusRole === role ? null : role)}
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.action,
                  borderRadius: theme.radius.card,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  backgroundColor: focusRole === role ? theme.colors.action : "transparent",
                }}
              >
                <Text style={{ color: focusRole === role ? theme.colors.surface : theme.colors.action }}>
                  {ROLE_LABELS[role]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
        {editMode ? <Button label="Standard wiederherstellen" variant="secondary" onPress={restoreDefaults} /> : null}
        <Button label={editMode ? "Fertig" : "Anpassen"} variant="secondary" onPress={() => setEditMode((v) => !v)} />
      </View>

      {effectiveOrder.map((id, index) => {
        const pref = layout.prefs[id];
        if (!pref?.visible) return null;
        const controls = editMode ? (
          <WidgetEditControls
            size={pref.size}
            canMoveUp={index > 0}
            canMoveDown={index < effectiveOrder.length - 1}
            onMoveUp={() => moveWidget(id, -1)}
            onMoveDown={() => moveWidget(id, 1)}
            onToggleSize={() => toggleSize(id)}
            onHide={() => hideWidget(id)}
          />
        ) : undefined;

        if (id === "W-02") return <MyAccountWidget key={id} member={member} size={pref.size} controls={controls} />;
        if (id === "W-03")
          return (
            <MyAssignmentsWidget key={id} membershipId={member.membershipId} size={pref.size} controls={controls} />
          );
        if (id === "W-04") return <AdministrationWidget key={id} size={pref.size} controls={controls} />;
        if (id === "W-05")
          return <ModulesWidget key={id} hasAdminAccess={member.hasAdminAccess} size={pref.size} controls={controls} />;
        return null;
      })}

      {editMode && hiddenWidgets.length > 0 ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Text variant="caption" style={{ marginBottom: theme.spacing.sm }}>
            Ausgeblendet
          </Text>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm, flexWrap: "wrap" }}>
            {hiddenWidgets.map((id) => (
              <Button key={id} label={`${id} einblenden`} variant="secondary" onPress={() => showWidget(id)} />
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
