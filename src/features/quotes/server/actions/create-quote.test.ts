import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetQuotesStore,
} from "@/features/quotes/server/store/quotes-store";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("createQuote action", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();
  });

  it("creates a quote with valid input", async () => {
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

    const { createQuote } = await import(
      "@/features/quotes/server/actions/create-quote"
    );

    const result = await createQuote({
      clientId: "client-sunrise-yoga",
      title: "Test Quote",
      selectedServicePackageIds: ["package-brand-launch"],
      terms: "Net 30",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.title).toBe("Test Quote");
      expect(result.data.quote.status).toBe("draft");
      expect(result.data.quote.clientId).toBe("client-sunrise-yoga");
      expect(result.data.quote.selectedServicePackageIds).toEqual([
        "package-brand-launch",
      ]);
    }
  });

  it("rejects invalid input with field errors", async () => {
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

    const { createQuote } = await import(
      "@/features/quotes/server/actions/create-quote"
    );

    const result = await createQuote({
      clientId: "",
      title: "",
      selectedServicePackageIds: [],
      terms: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.fieldErrors).toBeDefined();
      expect(result.error.fieldErrors!.clientId).toBeDefined();
      expect(result.error.fieldErrors!.title).toBeDefined();
      expect(result.error.fieldErrors!.selectedServicePackageIds).toBeDefined();
    }
  });

  it("rejects when client does not belong to studio", async () => {
    const { requireSession } = await import("@/features/auth/require-session");

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "other-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const { createQuote } = await import(
      "@/features/quotes/server/actions/create-quote"
    );

    const result = await createQuote({
      clientId: "client-sunrise-yoga",
      title: "Test Quote",
      selectedServicePackageIds: ["package-brand-launch"],
      terms: "",
    });

    expect(result.ok).toBe(false);
  });

  it("rejects when selected service package is invalid for the studio", async () => {
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

    const { createQuote } = await import(
      "@/features/quotes/server/actions/create-quote"
    );

    const result = await createQuote({
      clientId: "client-sunrise-yoga",
      title: "Test Quote",
      selectedServicePackageIds: ["sp-nonexistent"],
      terms: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.fieldErrors?.selectedServicePackageIds).toBeDefined();
    }
  });

  it("rejects unauthenticated access", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { AppError } = await import("@/lib/errors/app-error");

    vi.mocked(requireSession).mockRejectedValue(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { createQuote } = await import(
      "@/features/quotes/server/actions/create-quote"
    );

    const result = await createQuote({
      clientId: "client-sunrise-yoga",
      title: "Test Quote",
      selectedServicePackageIds: ["package-brand-launch"],
      terms: "",
    });

    expect(result.ok).toBe(false);
  });
});
