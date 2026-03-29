import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL must be set before running Playwright. Update .env.local if your local Postgres credentials differ from the example.",
  );
}

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run db:reset:test && npm run dev",
    env: {
      ...process.env,
      NODE_ENV: "test",
      DATABASE_URL: testDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
      STUDIO_OWNER_EMAIL: process.env.STUDIO_OWNER_EMAIL ?? "owner@example.com",
      STUDIO_OWNER_PASSWORD: process.env.STUDIO_OWNER_PASSWORD ?? "dev-password",
    },
    port: 3000,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
