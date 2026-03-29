import { describe, expect, it } from "vitest";

import {
  getDatabaseEnvVarForRuntime,
  getDatabaseUrlForRuntime,
  isDatabaseConfiguredForRuntime,
} from "@/server/db/get-database-url";

describe("get-database-url", () => {
  it("uses DATABASE_URL outside test mode", () => {
    expect(
      getDatabaseUrlForRuntime({
        NODE_ENV: "development",
        DATABASE_URL: "postgresql://localhost:5432/mento-admin-dev",
        TEST_DATABASE_URL: "postgresql://localhost:5432/mento-admin-test",
      }),
    ).toBe("postgresql://localhost:5432/mento-admin-dev");
  });

  it("uses TEST_DATABASE_URL in test mode", () => {
    expect(
      getDatabaseUrlForRuntime({
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://localhost:5432/mento-admin-dev",
        TEST_DATABASE_URL: "postgresql://localhost:5432/mento-admin-test",
      }),
    ).toBe("postgresql://localhost:5432/mento-admin-test");
  });

  it("throws when the active runtime database URL is missing", () => {
    expect(() =>
      getDatabaseUrlForRuntime({
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://localhost:5432/mento-admin-dev",
        TEST_DATABASE_URL: undefined,
      }),
    ).toThrow(
      "TEST_DATABASE_URL is required to initialize the database client when NODE_ENV=test.",
    );
  });

  it("reports the required env var for each runtime", () => {
    expect(getDatabaseEnvVarForRuntime("development")).toBe("DATABASE_URL");
    expect(getDatabaseEnvVarForRuntime("test")).toBe("TEST_DATABASE_URL");
  });

  it("detects whether the active runtime is configured", () => {
    expect(
      isDatabaseConfiguredForRuntime({
        NODE_ENV: "development",
        DATABASE_URL: undefined,
        TEST_DATABASE_URL: "postgresql://localhost:5432/mento-admin-test",
      }),
    ).toBe(false);

    expect(
      isDatabaseConfiguredForRuntime({
        NODE_ENV: "test",
        DATABASE_URL: undefined,
        TEST_DATABASE_URL: "postgresql://localhost:5432/mento-admin-test",
      }),
    ).toBe(true);
  });
});
