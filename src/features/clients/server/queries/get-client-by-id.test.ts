import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("getClientById (query)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { __resetClientsStore } = await import(
      "@/features/clients/server/clients-repository"
    );
    __resetClientsStore();
  });

  it("returns the client record for an authenticated studio owner", async () => {
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

    const { getClientById } = await import(
      "@/features/clients/server/queries/get-client-by-id"
    );

    const result = await getClientById("client-sunrise-yoga");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.client.id).toBe("client-sunrise-yoga");
      expect(result.data.client.name).toBe("Sunrise Yoga Studio");
    }
  });

  it("returns an error envelope when the client does not exist", async () => {
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

    const { getClientById } = await import(
      "@/features/clients/server/queries/get-client-by-id"
    );

    const result = await getClientById("client-nonexistent");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNKNOWN");
    }
  });

  it("returns a FORBIDDEN error when the client belongs to a different studio", async () => {
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

    const { getClientById } = await import(
      "@/features/clients/server/queries/get-client-by-id"
    );

    const result = await getClientById("client-other-studio");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("returns an UNAUTHORIZED error when there is no active session", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { AppError } = await import("@/lib/errors/app-error");

    vi.mocked(requireSession).mockRejectedValueOnce(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { getClientById } = await import(
      "@/features/clients/server/queries/get-client-by-id"
    );

    const result = await getClientById("client-sunrise-yoga");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });
});
