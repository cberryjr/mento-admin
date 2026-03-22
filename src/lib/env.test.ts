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

  it("applies defaults for optional variables in development", async () => {
    process.env = {
      NODE_ENV: "development",
    };

    const mod = await import("@/lib/env");

    expect(mod.env.NEXTAUTH_SECRET).toBe("dev-nextauth-secret-change-me");
    expect(mod.env.NEXTAUTH_URL).toBe("http://localhost:3000");
  });

  it("throws when NODE_ENV=production and NEXTAUTH_SECRET uses default", async () => {
    process.env = {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://localhost:5432/test",
      NEXTAUTH_URL: "https://example.com",
      STUDIO_OWNER_EMAIL: "real@example.com",
      STUDIO_OWNER_PASSWORD: "strong-password-123",
    };

    await expect(import("@/lib/env")).rejects.toThrow(
      "NEXTAUTH_SECRET must be set to a strong secret in production",
    );
  });
});
