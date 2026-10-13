import { Redirect } from "expo-router";

// Always points at the dashboard; the root layout's Guard intercepts and
// sends unauthenticated visitors to (auth)/login instead (see
// src/app/_layout.tsx) — this avoids this screen itself encoding any
// auth-state logic that could get out of sync with the real guard.
export default function Index() {
  return <Redirect href="/(app)/dashboard" />;
}
