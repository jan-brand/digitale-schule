import { Redirect, Slot, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

// One account = exactly one school (D-004) — there is no school-switching
// route, so route guarding only needs two states: signed in -> (app),
// signed out -> (auth). The RLS layer (supabase/migrations/...) is the
// real security boundary regardless of what this guard does — this is
// UX only (doc/ARCHITECTURE.md: "Clientseitige School-ID wird nie als
// Autorisierungsnachweis anerkannt" applies to the same principle here).
function Guard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return null;
  }

  const inAuthGroup = segments[0] === "(auth)";

  if (!session && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }
  if (session && inAuthGroup) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Guard>
          <Slot />
        </Guard>
      </AuthProvider>
    </ThemeProvider>
  );
}
