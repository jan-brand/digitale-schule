module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // e2e/ holds Playwright specs (run via `npm run e2e`), not Jest ones —
  // without this, jest-expo's default testMatch picks up *.spec.ts
  // there too and fails with "Playwright Test needs to be invoked via
  // 'npx playwright test'".
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/e2e/"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
};
