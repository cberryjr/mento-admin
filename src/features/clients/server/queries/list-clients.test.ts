import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("listClients", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { __resetClientsStore } = await import(
      "@/features/clients/server/clients-repository"
    );
    __resetClientsStore();
  });

  it("returns studio-scoped clients for an authenticated owner", async () => {
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

    const { listClients } = await import(
      "@/features/clients/server/queries/list-clients"
    );

    const result = await listClients();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.clients.length).toBeGreaterThan(0);
      // Every returned client must have id, name, contactEmail, updatedAt.
      for (const client of result.data.clients) {
        expect(client.id).toBeTruthy();
        expect(client.name).toBeTruthy();
      }
      // Clients from other studios must NOT appear.
      expect(
        result.data.clients.every((c) => !c.id.includes("other-studio")),
      ).toBe(true);
    }
  });

  it("returns an unauthorized error when there is no active session", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { AppError } = await import("@/lib/errors/app-error");

    vi.mocked(requireSession).mockRejectedValueOnce(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { listClients } = await import(
      "@/features/clients/server/queries/list-clients"
    );

    const result = await listClients();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });
});
