import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { DashboardWidget, WidgetSize } from "@/components/ui/DashboardWidget";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { CurrentMember } from "@/features/identity/useCurrentMember";

interface AccountWidgetProps {
  member: CurrentMember | null;
  memberLoading: boolean;
  effectiveEmail: string;
  onChangeEmail: (value: string) => void;
  onSaveEmail: () => void;
  savingEmail: boolean;
  emailSaved: boolean;
  isVerified: boolean;
  onRequestVerification: () => void;
  requestingVerification: boolean;
  verificationRequested: boolean;
  error: string | null;
  size: WidgetSize;
}

// S-01 "Konto" (doc/SETTINGS_WIDGETS_PLAN.md §3) — fest, nicht über
// WidgetEditControls ausblendbar: die Kontakt-E-Mail-/Verifizierung ist
// eine verbindliche Produktanforderung (D-009, POC-05) und bleibt
// daher immer sichtbar, analog zu W-01 im Dashboard.
export function AccountWidget({
  member,
  memberLoading,
  effectiveEmail,
  onChangeEmail,
  onSaveEmail,
  savingEmail,
  emailSaved,
  isVerified,
  onRequestVerification,
  requestingVerification,
  verificationRequested,
  error,
  size,
}: AccountWidgetProps) {
  const { theme } = useTheme();
  return (
    <DashboardWidget title="Konto" size={size}>
      {!memberLoading && member ? (
        <Text variant="caption">
          {member.firstName} {member.lastName} · {member.schoolName}
        </Text>
      ) : null}

      <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.sm }}>
        <Input
          label="Kontakt-E-Mail"
          value={effectiveEmail}
          onChangeText={onChangeEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {member?.contactEmail ? (
          <Text variant="caption">{isVerified ? "Verifiziert" : "Noch nicht verifiziert"}</Text>
        ) : null}

        <Button
          label="E-Mail speichern"
          variant="secondary"
          onPress={onSaveEmail}
          loading={savingEmail}
          disabled={!effectiveEmail.trim() || effectiveEmail.trim() === member?.contactEmail}
        />
        {emailSaved ? (
          <Text variant="caption">Gespeichert. Bitte jetzt die Verifizierung anfordern.</Text>
        ) : null}

        {member?.contactEmail && !isVerified ? (
          <>
            <Button
              label="Verifizierungs-Link anfordern"
              onPress={onRequestVerification}
              loading={requestingVerification}
            />
            {verificationRequested ? (
              <Text variant="caption">Link versendet, falls die E-Mail-Adresse zustellbar ist.</Text>
            ) : null}
          </>
        ) : null}

        {error ? <Text style={{ color: "#D92D20" }}>{error}</Text> : null}
      </View>
    </DashboardWidget>
  );
}
