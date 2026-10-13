import type { Session } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { signInWithUsername, signOut as signOutApi, SignInParams } from "@/features/auth/api";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signIn: (params: SignInParams) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Session restore/refresh is handled by supabase-js itself once a session
// has been set via signInWithUsername (see src/features/auth/api.ts) —
// this provider just mirrors that state into React and exposes
// sign-in/out. Real route guarding based on `session` is wired up in
// src/app/_layout.tsx.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    loading,
    signIn: signInWithUsername,
    signOut: signOutApi,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
