import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("createClient", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { __resetClientsStore } = await import(
      "@/features/clients/server/clients-repository"
    );
    __resetClientsStore();
  });

  it("returns field errors for invalid payloads (auth first, then validation)", async () => {
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

    const { createClient } = await import("@/features/clients/server/actions/create-client");

    const result = await createClient({
      name: "",
      contactName: "",
      contactEmail: "not-an-email",
      contactPhone: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.name).toBeDefined();
      expect(result.error.fieldErrors?.contactEmail).toBeDefined();
    }
  });

  it("creates a client for an authenticated studio owner and revalidates affected paths", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { revalidatePath } = await import("next/cache");

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const { createClient } = await import("@/features/clients/server/actions/create-client");

    const result = await createClient({
      name: "Northwind Creative",
      contactName: "Casey Jones",
      contactEmail: "casey@example.com",
      contactPhone: "+1 555 0100",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.client.name).toBe("Northwind Creative");
      expect(result.data.client.studioId).toBe("default-studio");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/clients");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(
        `/clients/${result.data.client.id}`,
      );
    }
  });

  it("returns unauthorized when there is no active session", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { AppError } = await import("@/lib/errors/app-error");

    vi.mocked(requireSession).mockRejectedValueOnce(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { createClient } = await import("@/features/clients/server/actions/create-client");

    const result = await createClient({
      name: "Northwind Creative",
      contactName: "Casey Jones",
      contactEmail: "casey@example.com",
      contactPhone: "+1 555 0100",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });
});
