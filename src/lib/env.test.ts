import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = process.env;

describe("env", () => {
  afterEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  it("parses development env without DATABASE_URL", async () => {
    process.env = {
      NODE_ENV: "development",
      NEXTAUTH_URL: "http://localhost:3000",
    };

    const mod = await import("@/lib/env");

    expect(mod.env.NODE_ENV).toBe("development");
    expect(mod.env.DATABASE_URL).toBeUndefined();
  });

  it("throws when NODE_ENV=production and DATABASE_URL is missing", async () => {
    process.env = {
      NODE_ENV: "production",
    };

    await expect(import("@/lib/env")).rejects.toThrow(
      "DATABASE_URL is required when NODE_ENV=production",
    );
  });
});
