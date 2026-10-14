import { Slot, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

// One account = exactly one school (D-004) — there is no school-switching
// route, so route guarding only needs two states: signed in -> (app),
// signed out -> (auth). The RLS layer (supabase/migrations/...) is the
// real security boundary regardless of what this guard does — this is
// UX only (doc/ARCHITECTURE.md: "Clientseitige School-ID wird nie als
// Autorisierungsnachweis anerkannt" applies to the same principle here).
//
// Must always render `children` (the Slot) on every render, including
// the very first one — returning null while `loading` is true, as an
// earlier version did, means the router's navigator never mounts, and
// a later <Redirect> then throws "Attempted to navigate before
// mounting the Root Layout component", leaving a permanently blank
// page. Redirecting is instead done imperatively in an effect, gated
// on the navigator actually being ready (useRootNavigationState).
function Guard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key || loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(app)/dashboard");
    }
  }, [navigationState?.key, loading, session, segments, router]);

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
