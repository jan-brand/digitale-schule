import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { WidgetEditControls } from "@/components/ui/WidgetEditControls";
import { WidgetSize } from "@/components/ui/DashboardWidget";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrentMember } from "@/features/identity/useCurrentMember";
import { useTheme } from "@/providers/ThemeProvider";
import { requestOwnEmailVerification, setOwnContactEmail } from "@/features/identity/contactEmailApi";
import { AccountWidget } from "@/components/settings/widgets/AccountWidget";
import { SecurityWidget } from "@/components/settings/widgets/SecurityWidget";
import { AppearanceWidget } from "@/components/settings/widgets/AppearanceWidget";

// doc/SETTINGS_WIDGETS_PLAN.md: same widget pattern as the dashboard
// (src/app/(app)/dashboard.tsx). S-01 "Konto" and S-02 "Sicherheit" are
// compliance/security-critical and rendered fixed, without
// WidgetEditControls — analogous to W-01 on the dashboard. S-03
// "Darstellung" is the only personalizable widget (sortier-/
// ausblendbar per UX-DEC-25), persisted device-local like the
// dashboard's own layout, under a separate storage key so the two
// personalizations never overwrite each other.
type WidgetId = "S-03";

interface WidgetPref {
  visible: boolean;
  size: WidgetSize;
}

type Layout = { order: WidgetId[]; prefs: Record<WidgetId, WidgetPref> };

const STORAGE_KEY = "campus.settingsWidgets.v1";

function defaultLayout(): Layout {
  return { order: ["S-03"], prefs: { "S-03": { visible: true, size: "small" } } };
}

function reconcile(stored: Layout | null): Layout {
  const fresh = defaultLayout();
  if (!stored) return fresh;
  return {
    order: fresh.order,
    prefs: { "S-03": stored.prefs["S-03"] ?? fresh.prefs["S-03"] },
  };
}

// Persists on-device only for the theme toggle (AsyncStorage via
// ThemeProvider) and the widget layout above. Profile name fields stay
// read-only here — renaming is an admin action (fn_set_username
// precedent), not self-service; only contact_email is self-service
// (POC-05, migration 20261015000003).
export default function SettingsScreen() {
  const { theme } = useTheme();
  const { session, signOut } = useAuth();
  const { member, loading, refetch } = useCurrentMember();

  const [emailInput, setEmailInput] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [requestingVerification, setRequestingVerification] = useState(false);
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [layout, setLayout] = useState<Layout | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const parsed: Layout | null = stored ? JSON.parse(stored) : null;
      setLayout(reconcile(parsed));
    });
  }, []);

  function persist(next: Layout) {
    setLayout(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
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
    persist(defaultLayout());
  }

  async function handleSaveEmail() {
    if (!session) return;
    setError(null);
    setSavingEmail(true);
    setEmailSaved(false);
    setVerificationRequested(false);
    try {
      await setOwnContactEmail(session.user.id, emailInput.trim());
      setEmailSaved(true);
      refetch();
    } catch {
      setError("E-Mail-Adresse konnte nicht gespeichert werden.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleRequestVerification() {
    setError(null);
    setRequestingVerification(true);
    try {
      await requestOwnEmailVerification();
      setVerificationRequested(true);
    } catch {
      setError("Verifizierung konnte nicht angefragt werden.");
    } finally {
      setRequestingVerification(false);
    }
  }

  const effectiveEmail = emailInput || member?.contactEmail || "";
  const isVerified = Boolean(member?.contactEmail && member?.contactEmailVerifiedAt);

  if (!layout) {
    return (
      <Screen scroll title="Einstellungen">
        <Text variant="title">Einstellungen</Text>
      </Screen>
    );
  }

  const appearancePref = layout.prefs["S-03"];
  const appearanceHidden = !appearancePref.visible;

  return (
    <Screen scroll title="Einstellungen">
      <Text variant="title">Einstellungen</Text>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
        <AccountWidget
          member={member}
          memberLoading={loading}
          effectiveEmail={effectiveEmail}
          onChangeEmail={(v) => {
            setEmailInput(v);
            setEmailSaved(false);
          }}
          onSaveEmail={handleSaveEmail}
          savingEmail={savingEmail}
          emailSaved={emailSaved}
          isVerified={isVerified}
          onRequestVerification={handleRequestVerification}
          requestingVerification={requestingVerification}
          verificationRequested={verificationRequested}
          error={error}
          size="large"
        />

        <SecurityWidget onSignOut={() => signOut()} size="large" />

        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: theme.spacing.sm }}>
          {editMode ? <Button label="Standard wiederherstellen" variant="secondary" onPress={restoreDefaults} /> : null}
          <Button label={editMode ? "Fertig" : "Anpassen"} variant="secondary" onPress={() => setEditMode((v) => !v)} />
        </View>

        {appearancePref.visible ? (
          <AppearanceWidget
            size={appearancePref.size}
            controls={
              editMode ? (
                <WidgetEditControls
                  size={appearancePref.size}
                  canMoveUp={false}
                  canMoveDown={false}
                  onMoveUp={() => {}}
                  onMoveDown={() => {}}
                  onToggleSize={() => toggleSize("S-03")}
                  onHide={() => hideWidget("S-03")}
                />
              ) : undefined
            }
          />
        ) : null}

        {editMode && appearanceHidden ? (
          <View>
            <Text variant="caption" style={{ marginBottom: theme.spacing.sm }}>
              Ausgeblendet
            </Text>
            <Button label="Darstellung einblenden" variant="secondary" onPress={() => showWidget("S-03")} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
