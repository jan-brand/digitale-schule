import { Redirect } from "expo-router";

// Placeholder entry route. Phase F2 replaces this with real auth-state based
// routing (session -> role landing, no session -> (auth)/login).
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
