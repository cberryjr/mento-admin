import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("studio defaults integration flow", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { __resetStudioDefaultsStore } = await import(
      "@/features/studio-defaults/server/store/studio-defaults-store"
    );
    __resetStudioDefaultsStore();

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

  it("saves defaults and returns same values on reload", async () => {
    const { updateStudioDefaults } = await import(
      "@/features/studio-defaults/server/actions/update-studio-defaults"
    );
    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );

    const updateResult = await updateStudioDefaults({
      studioName: "Northwind Creative",
      studioContactName: "Casey Jones",
      studioContactEmail: "casey@example.com",
      studioContactPhone: "+1 555 0100",
      defaultQuoteTerms: "50% due at project start. Net 15 for remainder.",
      defaultInvoicePaymentInstructions: "Pay by ACH within 15 days.",
    });

    expect(updateResult.ok).toBe(true);

    const readResult = await getStudioDefaults();

    expect(readResult.ok).toBe(true);
    if (readResult.ok && readResult.data.studioDefaults) {
      expect(readResult.data.studioDefaults.studioName).toBe("Northwind Creative");
      expect(readResult.data.studioDefaults.prefill.defaultQuoteTerms).toContain("Net 15");
    }
  });
});
