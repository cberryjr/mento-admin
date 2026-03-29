import { describe, expect, it } from "vitest";

import {
  assertLocalPostgresDatabaseUrl,
  getDatabaseName,
  toMaintenanceDatabaseUrl,
} from "@/server/db/local-db-safety";

describe("local-db-safety", () => {
  it("accepts localhost PostgreSQL URLs with the expected database", () => {
    const url = assertLocalPostgresDatabaseUrl(
      "postgresql://postgres:postgres@localhost:5432/mento-admin-test",
      {
        purpose: "Test database reset",
        expectedDatabaseNames: ["mento-admin-test"],
      },
    );

    expect(getDatabaseName(url)).toBe("mento-admin-test");
  });

  it("rejects non-local hosts", () => {
    expect(() =>
      assertLocalPostgresDatabaseUrl(
        "postgresql://postgres:postgres@db.internal:5432/mento-admin-test",
        {
          purpose: "Test database reset",
          expectedDatabaseNames: ["mento-admin-test"],
        },
      ),
    ).toThrow('Test database reset only supports localhost databases. Received host "db.internal".');
  });

  it("rejects unexpected database names", () => {
    expect(() =>
      assertLocalPostgresDatabaseUrl(
        "postgresql://postgres:postgres@localhost:5432/not-the-test-db",
        {
          purpose: "Test database reset",
          expectedDatabaseNames: ["mento-admin-test"],
        },
      ),
    ).toThrow(
      'Test database reset only supports "mento-admin-test". Received "not-the-test-db".',
    );
  });

  it("accepts IPv6 localhost URLs", () => {
    const url = assertLocalPostgresDatabaseUrl(
      "postgresql://postgres:postgres@[::1]:5432/mento-admin-test",
      {
        purpose: "Test database reset",
        expectedDatabaseNames: ["mento-admin-test"],
      },
    );

    expect(getDatabaseName(url)).toBe("mento-admin-test");
  });

  it("builds a maintenance database URL from an app database URL", () => {
    expect(
      toMaintenanceDatabaseUrl(
        "postgresql://postgres:postgres@localhost:5432/mento-admin-dev",
      ),
    ).toBe("postgresql://postgres:postgres@localhost:5432/postgres");
  });
});
