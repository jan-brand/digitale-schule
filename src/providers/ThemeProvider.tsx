import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { resolveTheme, Theme, ThemeMode } from "@/theme";

const STORAGE_KEY = "campus.themeMode";

interface ThemeContextValue {
  mode: ThemeMode;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// NOTE: this persists the theme choice on-device only (AsyncStorage) as a
// placeholder. Phase F3 syncs the real choice through `user_preferences`
// (per doc/DATA_MODEL.md) so it follows the user across devices (AC-08/AC-09
// in doc/ACCEPTANCE.md).
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark" || stored === "system") {
          setModeState(stored);
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Best-effort persistence; a failed write just falls back to "system"
      // on next launch, which is an acceptable degraded state.
    });
  };

  const resolvedScheme = mode === "system" ? (systemScheme ?? "light") : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      theme: resolveTheme(resolvedScheme === "dark" ? "dark" : "light"),
      setMode,
    }),
    [mode, resolvedScheme],
  );

  if (!hydrated) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
