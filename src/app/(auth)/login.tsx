import { useState } from "react";
import { Platform, View, useWindowDimensions } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordField } from "@/components/ui/PasswordField";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { Theme } from "@/theme";
import { isValidLoginInput, normalizeSchoolSlug } from "@/features/auth/username";

// Desktop breakpoint per doc/UI_UX_SPECIFICATION.md §4 ("Breite >= 1200").
// Tablet/Mobile below that are left untouched per TODO/login_layout_update.md.
const DESKTOP_BREAKPOINT = 1200;

// Calls auth-login (via AuthProvider.signIn), which resolves
// schoolSlug+username to the real Supabase Auth identity server-side —
// see doc/ARCHITECTURE.md "Auth-Grenze" and supabase/functions/auth-login.
// Errors are shown generically; the Edge Function itself never
// distinguishes "wrong school/username" from "wrong password"
// (doc/SECURITY_AUTH.md: no enumeration), so neither does this screen.
export default function LoginScreen() {
  const { signIn } = useAuth();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const [step, setStep] = useState<"school" | "credentials">("school");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = normalizeSchoolSlug(schoolSlug).length > 0;
  const canSubmit = isValidLoginInput(schoolSlug, username, password) && !loading;

  function handleContinue() {
    if (!canContinue) return;
    setError(null);
    setStep("credentials");
  }

  function handleChangeSchool() {
    setError(null);
    setStep("school");
  }

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn({ schoolSlug, username, password });
    } catch {
      setError("Anmeldung fehlgeschlagen. Bitte Schule, Benutzername und Passwort prüfen.");
    } finally {
      setLoading(false);
    }
  }

  const form = (
    <>
      <Text variant="title" style={isDesktop && { marginLeft: theme.spacing.xl }}>
        Anmelden
      </Text>
      <View
        style={[
          { gap: theme.spacing.md, marginTop: theme.spacing.lg },
          isDesktop && { alignSelf: "flex-start", width: 360, marginLeft: theme.spacing.xl },
        ]}
      >
        {step === "school" ? (
          <>
            <Input
              label="Schule"
              placeholder="z. B. demo-a"
              value={schoolSlug}
              onChangeText={setSchoolSlug}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleContinue}
              autoFocus
            />
            <Button label="Weiter" onPress={handleContinue} disabled={!canContinue} />
          </>
        ) : (
          <>
            <Button
              label={`Schule: ${schoolSlug}`}
              onPress={handleChangeSchool}
              variant="secondary"
            />
            <Input
              label="Benutzername"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <PasswordField
              label="Passwort"
              value={password}
              onChangeText={setPassword}
              errorMessage={error ?? undefined}
            />
            <Button label="Anmelden" onPress={handleSubmit} disabled={!canSubmit} loading={loading} />
          </>
        )}
      </View>
    </>
  );

  if (!isDesktop) {
    return <Screen title="Anmelden">{form}</Screen>;
  }

  // Desktop only: a branded split-screen frame around the unchanged form
  // above — purely presentational, no change to the login flow itself
  // (TODO/login_layout_update.md point 4).
  return (
    <Screen title="Anmelden" style={{ padding: 0 }}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        <BrandPanel theme={theme} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: theme.spacing.xl }}>
          <View
            style={[
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.card,
                paddingVertical: theme.spacing.xl,
                paddingHorizontal: theme.spacing.md,
                maxWidth: 480,
                width: "100%",
                alignSelf: "center",
              },
              Platform.OS === "web"
                ? ({ boxShadow: "0 12px 32px rgba(26, 16, 40, 0.12)" } as object)
                : {
                    shadowColor: "#1A1028",
                    shadowOpacity: 0.12,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 4,
                  },
            ]}
          >
            {form}
          </View>
        </View>
      </View>
    </Screen>
  );
}

function BrandPanel({ theme }: { theme: Theme }) {
  return (
    <View
      style={{
        flex: 1.3,
        maxWidth: 720,
        backgroundColor: theme.colors.action,
        overflow: "hidden",
        justifyContent: "center",
        padding: theme.spacing.xl,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: theme.colors.accent,
          opacity: 0.16,
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -90,
          left: -40,
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: theme.colors.accent,
          opacity: 0.12,
        }}
      />
      <Text
        variant="title"
        style={{ color: theme.colors.surface, fontSize: 36, marginBottom: theme.spacing.sm }}
      >
        Campus
      </Text>
      <Text style={{ color: theme.colors.surface, opacity: 0.85, maxWidth: 360, fontSize: 17 }}>
        Die digitale Plattform für Schulen – Unterricht, Verwaltung und Kommunikation an einem Ort.
      </Text>
    </View>
  );
}
