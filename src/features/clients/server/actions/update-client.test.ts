import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("updateClient", () => {
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

    const { updateClient } = await import("@/features/clients/server/actions/update-client");

    const result = await updateClient("client-sunrise-yoga", {
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

  it("updates a studio-owned client and revalidates affected paths", async () => {
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

    const { updateClient } = await import("@/features/clients/server/actions/update-client");

    const result = await updateClient("client-sunrise-yoga", {
      name: "Sunrise Yoga Collective",
      contactName: "Avery Patel",
      contactEmail: "hello@sunriseyoga.example",
      contactPhone: "+1 555 0123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.client.name).toBe("Sunrise Yoga Collective");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/clients");
      expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith(
        "/clients/client-sunrise-yoga",
      );
    }
  });

  it("returns forbidden when the client belongs to a different studio", async () => {
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

    const { updateClient } = await import("@/features/clients/server/actions/update-client");

    const result = await updateClient("client-other-studio", {
      name: "Hidden Orchard Bakery",
      contactName: "Riley Chen",
      contactEmail: "owner@hiddenorchard.example",
      contactPhone: "+1 555 0199",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });
});
