import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@/providers/ThemeProvider";

// Route guarding (no session -> (auth), active session -> (app)/dashboard)
// is added once AuthProvider exists (Auth PoC, M2 / doc/ARCHITECTURE.md
// "Auth-Grenze"). One account = exactly one school (D-004) — there is no
// school-switching route.
export default function RootLayout() {
  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
