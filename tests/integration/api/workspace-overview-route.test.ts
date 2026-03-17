import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("GET /api/workspace/overview", () => {
  it("returns unauthorized envelope when session is missing", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { AppError } = await import("@/lib/errors/app-error");

    vi.mocked(requireSession).mockRejectedValueOnce(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { GET } = await import("@/app/api/workspace/overview/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You must sign in to continue.",
      },
    });
  });

  it("returns success envelope for authenticated session", async () => {
    const { requireSession } = await import("@/features/auth/require-session");

    vi.mocked(requireSession).mockResolvedValueOnce({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        studioId: "default-studio",
        role: "owner",
      },
      expires: new Date(Date.now() + 3_600_000).toISOString(),
    } as never);

    const { GET } = await import("@/app/api/workspace/overview/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.workspaceId).toBe("default-studio");
  });
});
