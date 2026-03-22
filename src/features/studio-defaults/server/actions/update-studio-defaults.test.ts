import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("updateStudioDefaults", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/features/studio-defaults/server/store/studio-defaults-store");
    mod.__resetStudioDefaultsStore();
  });

  it("returns field errors for invalid payload", async () => {
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

    const { updateStudioDefaults } = await import(
      "@/features/studio-defaults/server/actions/update-studio-defaults"
    );

    const result = await updateStudioDefaults({
      studioName: "",
      studioContactName: "",
      studioContactEmail: "",
      studioContactPhone: "",
      defaultQuoteTerms: "",
      defaultInvoicePaymentInstructions: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.studioName).toBeDefined();
      expect(result.error.fieldErrors?.studioContactName).toBeDefined();
    }
  });

  it("persists and returns studio defaults for authenticated owner", async () => {
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

    const { updateStudioDefaults } = await import(
      "@/features/studio-defaults/server/actions/update-studio-defaults"
    );

    const result = await updateStudioDefaults({
      studioName: "Northwind Creative",
      studioContactName: "Casey Jones",
      studioContactEmail: "casey@example.com",
      studioContactPhone: "+1 555 0100",
      defaultQuoteTerms: "50% upfront. Net 15 for remaining balance.",
      defaultInvoicePaymentInstructions: "Please pay by ACH within 15 days.",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.studioDefaults.studioName).toBe("Northwind Creative");
      expect(result.data.studioDefaults.prefill.defaultQuoteTerms).toContain("Net 15");
    }
  });

  it("returns unauthorized error when session is missing", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { AppError } = await import("@/lib/errors/app-error");

    vi.mocked(requireSession).mockRejectedValueOnce(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { updateStudioDefaults } = await import(
      "@/features/studio-defaults/server/actions/update-studio-defaults"
    );

    const result = await updateStudioDefaults({
      studioName: "Northwind Creative",
      studioContactName: "Casey Jones",
      studioContactEmail: "",
      studioContactPhone: "",
      defaultQuoteTerms: "Net 15",
      defaultInvoicePaymentInstructions: "ACH",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });
});
