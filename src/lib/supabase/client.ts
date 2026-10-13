import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "Copy .env.example to .env.local and fill in your Supabase project's URL and anon key. " +
      "Never put the service-role key here.",
  );
}

// Session storage (SecureStore on native, a web-safe adapter) is wired up
// in Phase F2 alongside AuthProvider (doc/SECURITY.md rule on auth
// persistence). Until then this is an anon-key-only client suitable for
// public/unauthenticated reads.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
