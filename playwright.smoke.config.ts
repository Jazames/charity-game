import { defineConfig, devices } from "@playwright/test";

const requestedBaseURL = process.env.PLAYWRIGHT_BASE_URL;

if (!requestedBaseURL) {
  throw new Error("PLAYWRIGHT_BASE_URL is required for the deployed-site smoke test.");
}

const baseURL = requestedBaseURL.endsWith("/") ? requestedBaseURL : `${requestedBaseURL}/`;

export default defineConfig({
  testDir: "./tests/smoke",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "deployed-chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
