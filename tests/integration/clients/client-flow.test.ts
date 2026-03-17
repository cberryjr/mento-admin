import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("client integration flow", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { __resetClientsStore } = await import(
      "@/features/clients/server/clients-repository"
    );
    __resetClientsStore();

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
  });

  it("creates a client, reloads it in list/detail reads, and persists updates", async () => {
    const { createClient } = await import("@/features/clients/server/actions/create-client");
    const { updateClient } = await import("@/features/clients/server/actions/update-client");
    const { getClientById } = await import("@/features/clients/server/queries/get-client-by-id");
    const { listClients } = await import("@/features/clients/server/queries/list-clients");

    const createResult = await createClient({
      name: "Northwind Creative",
      contactName: "Casey Jones",
      contactEmail: "casey@example.com",
      contactPhone: "+1 555 0100",
    });

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) {
      return;
    }

    const listResult = await listClients();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.data.clients.some((client) => client.id === createResult.data.client.id)).toBe(
        true,
      );
    }

    const updateResult = await updateClient(createResult.data.client.id, {
      name: "Northwind Creative",
      contactName: "Casey Jones",
      contactEmail: "projects@northwind.example",
      contactPhone: "+1 555 0109",
    });

    expect(updateResult.ok).toBe(true);

    const detailResult = await getClientById(createResult.data.client.id);
    expect(detailResult.ok).toBe(true);
    if (detailResult.ok) {
      expect(detailResult.data.client.contactEmail).toBe("projects@northwind.example");
      expect(detailResult.data.client.contactPhone).toBe("+1 555 0109");
    }
  });

  it("returns standard error envelopes for validation and authz denials", async () => {
    const { updateClient } = await import("@/features/clients/server/actions/update-client");
    const invalidResult = await updateClient("client-sunrise-yoga", {
      name: "",
      contactName: "",
      contactEmail: "not-an-email",
      contactPhone: "",
    });

    expect(invalidResult).toMatchObject({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
      },
    });

    const authzResult = await updateClient("client-other-studio", {
      name: "Hidden Orchard Bakery",
      contactName: "Riley Chen",
      contactEmail: "owner@hiddenorchard.example",
      contactPhone: "+1 555 0199",
    });

    expect(authzResult).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "You are not allowed to access this workspace.",
      },
    });
  });
});
