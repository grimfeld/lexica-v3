import { defineConfig, devices } from "@playwright/test";

// E2E runs against the Vite dev server (the web layer). Native Tauri E2E can be
// added later via tauri-driver. Keep to a handful of critical paths (TESTING.md).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: { baseURL: "http://localhost:5173", trace: "on-first-retry" },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
