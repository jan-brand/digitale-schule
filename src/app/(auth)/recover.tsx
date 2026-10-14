import { useState } from "react";
import { View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordField } from "@/components/ui/PasswordField";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/providers/ThemeProvider";
import { redeemRecoveryCode, requestEmailRecovery } from "@/features/auth/recoveryApi";

// Two recovery paths (D-012): a verified contact email (self-service —
// "E-Mail-Anfrage" below) or a one-time code a teacher already handed
// out in person ("Code einlösen" below). Both end at the same
// password-recovery-redeem Edge Function once a code/token exists.
export default function RecoverScreen() {
  const { theme } = useTheme();

  const [schoolSlug, setSchoolSlug] = useState("");
  const [username, setUsername] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState(false);

  async function handleRequest() {
    setRequesting(true);
    try {
      await requestEmailRecovery(schoolSlug, username);
    } finally {
      // Always show the same confirmation, whether or not an account
      // with a verified email actually exists (no enumeration).
      setRequestSent(true);
      setRequesting(false);
    }
  }

  async function handleRedeem() {
    setRedeemError(null);
    setRedeeming(true);
    try {
      await redeemRecoveryCode(token, newPassword);
      setRedeemed(true);
    } catch {
      setRedeemError("Code ungültig, abgelaufen oder bereits verwendet.");
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <Screen scroll>
      <Text variant="title">Zugang wiederherstellen</Text>

      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Text variant="body">Code einlösen</Text>
        <Text variant="caption">
          Haben Sie einen Einmalcode von Ihrer Lehrkraft erhalten? Geben Sie ihn hier mit einem
          neuen Passwort ein.
        </Text>
        {redeemed ? (
          <Text variant="caption">Neues Passwort gesetzt. Sie können sich jetzt anmelden.</Text>
        ) : (
          <>
            <Input label="Code" value={token} onChangeText={setToken} autoCapitalize="none" />
            <PasswordField label="Neues Passwort" value={newPassword} onChangeText={setNewPassword} />
            <Button
              label="Passwort setzen"
              onPress={handleRedeem}
              loading={redeeming}
              disabled={!token.trim() || newPassword.length < 8}
            />
            {redeemError ? <Text style={{ color: "#D92D20" }}>{redeemError}</Text> : null}
          </>
        )}
      </View>

      <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.sm }}>
        <Text variant="body">Per E-Mail anfragen</Text>
        <Text variant="caption">
          Falls eine verifizierte E-Mail-Adresse hinterlegt ist, erhalten Sie einen Link.
        </Text>
        {requestSent ? (
          <Text variant="caption">
            Falls ein Konto mit verifizierter E-Mail existiert, wurde eine Nachricht versendet.
          </Text>
        ) : (
          <>
            <Input label="Schule" value={schoolSlug} onChangeText={setSchoolSlug} autoCapitalize="none" />
            <Input label="Benutzername" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <Button
              label="Anfrage senden"
              variant="secondary"
              onPress={handleRequest}
              loading={requesting}
              disabled={!schoolSlug.trim() || !username.trim()}
            />
          </>
        )}
      </View>
    </Screen>
  );
}
