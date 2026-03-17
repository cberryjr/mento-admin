import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("getStudioDefaults", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/features/studio-defaults/server/store/studio-defaults-store");
    mod.__resetStudioDefaultsStore();
  });

  it("returns null defaults before first save", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );

    const result = await getStudioDefaults();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.studioDefaults).toBeNull();
    }
  });
});
