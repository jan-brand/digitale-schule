import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrentMember } from "@/features/identity/useCurrentMember";
import { useTheme } from "@/providers/ThemeProvider";
import { requestOwnEmailVerification, setOwnContactEmail } from "@/features/identity/contactEmailApi";

// Persists on-device only for the theme toggle (AsyncStorage via
// ThemeProvider). Profile name fields stay read-only here — renaming is
// an admin action (fn_set_username precedent), not self-service; only
// contact_email is self-service (POC-05, migration 20261015000003).
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

  return (
    <Screen scroll>
      <Text variant="title">Einstellungen</Text>

      <Text variant="body" style={{ marginTop: theme.spacing.lg }}>
        Profil
      </Text>
      {!loading && member ? (
        <Text variant="caption" style={{ marginTop: theme.spacing.xs }}>
          {member.firstName} {member.lastName} · {member.schoolName}
        </Text>
      ) : null}

      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
        <Input
          label="Kontakt-E-Mail"
          value={effectiveEmail}
          onChangeText={(v) => {
            setEmailInput(v);
            setEmailSaved(false);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {member?.contactEmail ? (
          <Text variant="caption">{isVerified ? "Verifiziert" : "Noch nicht verifiziert"}</Text>
        ) : null}

        <Button
          label="E-Mail speichern"
          variant="secondary"
          onPress={handleSaveEmail}
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
              onPress={handleRequestVerification}
              loading={requestingVerification}
            />
            {verificationRequested ? (
              <Text variant="caption">Link versendet, falls die E-Mail-Adresse zustellbar ist.</Text>
            ) : null}
          </>
        ) : null}

        {error ? <Text style={{ color: "#D92D20" }}>{error}</Text> : null}
      </View>

      <Text variant="body" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
        Darstellung
      </Text>
      <ThemeToggle />

      <View style={{ marginTop: theme.spacing.xl }}>
        <Button label="Abmelden" variant="secondary" onPress={() => signOut()} />
      </View>
    </Screen>
  );
}
