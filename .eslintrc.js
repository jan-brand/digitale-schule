module.exports = {
  root: true,
  extends: ["expo"],
  // supabase/functions runs on Deno, not this app's bundler; tools/
  // (the operator CLI, D-024) is a plain Node script, never bundled into
  // the Expo app — Expo-bundle-specific rules (e.g. no-dynamic-env-var,
  // which exists to keep EXPO_PUBLIC_* statically analyzable) don't
  // apply to either.
  ignorePatterns: ["dist/", "node_modules/", "supabase/functions/**/*.ts", "tools/**/*.ts"],
};
