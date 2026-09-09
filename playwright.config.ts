import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // This repo's pinned @playwright/test version may expect a browser
        // revision that isn't pre-downloaded in some sandboxes. Point at a
        // system Chromium install when PLAYWRIGHT_CHROMIUM_PATH is set
        // (falls back to Playwright's own managed browser otherwise —
        // run `npx playwright install chromium` if that's missing).
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
          : undefined,
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- -p 3100",
        url: "http://localhost:3100/login",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
