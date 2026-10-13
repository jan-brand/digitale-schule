import { Redirect } from "expo-router";

// Placeholder entry route. M2 replaces this with real auth-state based
// routing (session -> (app)/dashboard, no session -> (auth)/login).
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
