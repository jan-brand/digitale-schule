import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@/providers/ThemeProvider";

// Route guarding (unauthenticated -> (auth), multi-membership without an
// active selection -> select-school, else role landing) is added in Phase F2
// once AuthProvider/SchoolProvider exist (doc/ARCHITECTURE.md).
export default function RootLayout() {
  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
