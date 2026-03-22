import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

const OWNER_SESSION = {
  user: {
    id: "owner-1",
    email: "owner@example.com",
    role: "owner" as const,
    studioId: "default-studio",
  },
  expires: new Date(Date.now() + 360000).toISOString(),
};

describe("getStudioDefaults", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/features/studio-defaults/server/store/studio-defaults-store");
    mod.__resetStudioDefaultsStore();
  });

  it("returns null defaults before first save", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(OWNER_SESSION);

    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );

    const result = await getStudioDefaults();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.studioDefaults).toBeNull();
    }
  });

  it("returns saved defaults after a store write", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(OWNER_SESSION);

    const store = await import("@/features/studio-defaults/server/store/studio-defaults-store");
    store.writeStudioDefaultsToStore("default-studio", {
      studioName: "Northwind Creative",
      studioContactName: "Casey Jones",
      studioContactEmail: "casey@example.com",
      studioContactPhone: "+1 555 0100",
      defaultQuoteTerms: "Net 15",
      defaultInvoicePaymentInstructions: "ACH only",
    });

    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );

    const result = await getStudioDefaults();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.studioDefaults).not.toBeNull();
      expect(result.data.studioDefaults?.studioName).toBe("Northwind Creative");
      expect(result.data.studioDefaults?.prefill.defaultQuoteTerms).toBe("Net 15");
    }
  });

  it("returns FORBIDDEN error for non-owner role", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue({
      ...OWNER_SESSION,
      user: { ...OWNER_SESSION.user, role: "member" as "owner" },
    });

    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );

    const result = await getStudioDefaults();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FORBIDDEN");
    }
  });

  it("returns UNAUTHORIZED error when session is missing", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { AppError } = await import("@/lib/errors/app-error");

    vi.mocked(requireSession).mockRejectedValueOnce(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );

    const result = await getStudioDefaults();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
  });
});
