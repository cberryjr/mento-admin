import { describe, expect, it, vi } from "vitest";

describe("auth options", () => {
  it("returns a user for valid credentials", async () => {
    vi.resetModules();

    const { authorizeStudioOwner } = await import("@/features/auth/auth-options");
    const { env } = await import("@/lib/env");
    const user = await authorizeStudioOwner({
      email: env.STUDIO_OWNER_EMAIL,
      password: env.STUDIO_OWNER_PASSWORD,
    });

    expect(user).toMatchObject({
      email: env.STUDIO_OWNER_EMAIL,
      role: "owner",
      studioId: "default-studio",
    });
  });

  it("returns null for invalid credentials", async () => {
    vi.resetModules();

    const { authorizeStudioOwner } = await import("@/features/auth/auth-options");
    const { env } = await import("@/lib/env");
    const user = await authorizeStudioOwner({
      email: env.STUDIO_OWNER_EMAIL,
      password: "wrong",
    });

    expect(user).toBeNull();
  });
});
