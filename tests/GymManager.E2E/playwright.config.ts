import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? "http://localhost:5000/api/v1";

export default defineConfig({
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: "api",
      testDir: "./specs/api",
    },
    {
      name: "ui",
      testDir: "./specs/ui",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "journeys",
      testDir: "./specs/journeys",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Uncomment to auto-start services before tests
  // webServer: [
  //   {
  //     command: "dotnet run --project ../../src/apps/GymManager.Api",
  //     port: 5000,
  //     reuseExistingServer: true,
  //     timeout: 30_000,
  //   },
  //   {
  //     command: "npm run dev --prefix ../../src/apps/gymmanager-web",
  //     port: 3000,
  //     reuseExistingServer: true,
  //     timeout: 15_000,
  //   },
  // ],
});

export { API_URL };
