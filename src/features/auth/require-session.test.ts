import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/auth", () => ({
  getServerAuthSession: vi.fn(),
}));

describe("requireSession", () => {
  it("throws unauthorized error when there is no session", async () => {
    const { getServerAuthSession } = await import("@/server/auth/auth");
    vi.mocked(getServerAuthSession).mockResolvedValueOnce(null);

    const { requireSession } = await import("@/features/auth/require-session");

    await expect(requireSession()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("returns session when authenticated", async () => {
    const { getServerAuthSession } = await import("@/server/auth/auth");
    vi.mocked(getServerAuthSession).mockResolvedValueOnce({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        studioId: "default-studio",
        role: "owner",
      },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as never);

    const { requireSession } = await import("@/features/auth/require-session");
    const session = await requireSession();

    expect(session.user.id).toBe("owner-1");
  });
});
