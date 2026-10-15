import { defineConfig } from "@playwright/test";

// Runs against the real demo Supabase server (there is no local Supabase
// stack in this environment — see doc/IMPLEMENTATION_PLAN.md and the M14
// README section for why), talking to the Expo web dev server at
// CAMPUS_E2E_BASE_URL (default http://localhost:8081). Start that server
// yourself first (`npm run web`) — reuseExistingServer below means this
// config does not also try to start/manage it, since this project's dev
// server is usually already running in this environment and a second
// `expo start` on the same port would just fail.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.CAMPUS_E2E_BASE_URL ?? "http://localhost:8081",
    headless: true,
    screenshot: "only-on-failure",
    // Playwright's own `playwright install chromium` download is not
    // reachable from this environment's network (stalled indefinitely
    // in development). Point at the Chrome-for-Testing binary already
    // downloaded for this session's Puppeteer-based manual verification
    // instead — same underlying Chromium, just a different launcher.
    // Remove this override once `npx playwright install` works, or set
    // PLAYWRIGHT_CHROMIUM_PATH to wherever it lands in CI.
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_PATH ??
        "/Users/max/.cache/puppeteer/chrome/mac_arm-155.0.8059.39/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
    },
  },
});
