import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession } from "@/features/auth/session";
import { __resetQuotesStore } from "@/features/quotes/server/store/quotes-store";
import type { QuoteDetailRecord } from "@/features/quotes/types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

function setSession(studioId = "default-studio"): AuthSession {
  return {
    user: {
      id: "owner-1",
      email: "owner@example.com",
      role: "owner",
      studioId,
    },
    expires: new Date(Date.now() + 360000).toISOString(),
  };
}

function withStoreQuote(
  quoteId: string,
  updater: (quote: QuoteDetailRecord) => void,
) {
  const store = (
    globalThis as typeof globalThis & {
      __mentoQuotesStore?: Map<string, QuoteDetailRecord>;
    }
  ).__mentoQuotesStore;
  const quote = store?.get(quoteId);
  if (quote) {
    updater(quote);
  }
}

describe("markQuoteAccepted", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  it("successfully marks a draft quote with generated content as accepted", async () => {
    const repository = await import("@/features/quotes/server/quotes-repository");
    const { markQuoteAccepted } = await import(
      "@/features/quotes/server/actions/mark-quote-accepted"
    );

    const quote = await repository.createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    await repository.saveQuoteSections(quote.id, "default-studio", [
      {
        id: "section-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "sp-1",
        title: "Scope",
        content: "",
        position: 1,
        lineItems: [],
      },
    ]);

    const result = await markQuoteAccepted({ quoteId: quote.id });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.status).toBe("accepted");
    }
  });

  it("rejects when quote status is already accepted", async () => {
    const repository = await import("@/features/quotes/server/quotes-repository");
    const { markQuoteAccepted } = await import(
      "@/features/quotes/server/actions/mark-quote-accepted"
    );

    const quote = await repository.createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    await repository.saveQuoteSections(quote.id, "default-studio", [
      {
        id: "section-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "sp-1",
        title: "Scope",
        content: "",
        position: 1,
        lineItems: [],
      },
    ]);

    withStoreQuote(quote.id, (stored) => {
      stored.status = "accepted";
    });

    const result = await markQuoteAccepted({ quoteId: quote.id });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(
        "Only draft quotes can be marked as accepted.",
      );
    }
  });

  it("rejects when quote status is invoiced", async () => {
    const repository = await import("@/features/quotes/server/quotes-repository");
    const { markQuoteAccepted } = await import(
      "@/features/quotes/server/actions/mark-quote-accepted"
    );

    const quote = await repository.createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    await repository.saveQuoteSections(quote.id, "default-studio", [
      {
        id: "section-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "sp-1",
        title: "Scope",
        content: "",
        position: 1,
        lineItems: [],
      },
    ]);

    withStoreQuote(quote.id, (stored) => {
      stored.status = "invoiced";
    });

    const result = await markQuoteAccepted({ quoteId: quote.id });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(
        "Only draft quotes can be marked as accepted.",
      );
    }
  });

  it("rejects when quote has no generated content", async () => {
    const repository = await import("@/features/quotes/server/quotes-repository");
    const { markQuoteAccepted } = await import(
      "@/features/quotes/server/actions/mark-quote-accepted"
    );

    const quote = await repository.createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    const result = await markQuoteAccepted({ quoteId: quote.id });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(
        "Generate quote content before marking as accepted.",
      );
    }
  });

  it("rejects when quote not found", async () => {
    const { markQuoteAccepted } = await import(
      "@/features/quotes/server/actions/mark-quote-accepted"
    );

    const result = await markQuoteAccepted({ quoteId: "quote-does-not-exist" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Quote not found.");
    }
  });

  it("rejects when user lacks studio access", async () => {
    const repository = await import("@/features/quotes/server/quotes-repository");
    const { requireSession } = await import("@/features/auth/require-session");
    const { markQuoteAccepted } = await import(
      "@/features/quotes/server/actions/mark-quote-accepted"
    );

    vi.mocked(requireSession).mockResolvedValue(setSession("other-studio"));

    const quote = await repository.createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    await repository.saveQuoteSections(quote.id, "default-studio", [
      {
        id: "section-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "sp-1",
        title: "Scope",
        content: "",
        position: 1,
        lineItems: [],
      },
    ]);

    const result = await markQuoteAccepted({ quoteId: quote.id });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Quote not found.");
    }
  });

  it("returns standard success envelope", async () => {
    const repository = await import("@/features/quotes/server/quotes-repository");
    const { markQuoteAccepted } = await import(
      "@/features/quotes/server/actions/mark-quote-accepted"
    );

    const quote = await repository.createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    await repository.saveQuoteSections(quote.id, "default-studio", [
      {
        id: "section-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "sp-1",
        title: "Scope",
        content: "",
        position: 1,
        lineItems: [],
      },
    ]);

    const result = await markQuoteAccepted({ quoteId: quote.id });

    expect(result).toMatchObject({
      ok: true,
      data: {
        quote: {
          id: quote.id,
          status: "accepted",
        },
      },
    });
  });

  it("returns standard failure envelope", async () => {
    const { markQuoteAccepted } = await import(
      "@/features/quotes/server/actions/mark-quote-accepted"
    );

    const result = await markQuoteAccepted({ quoteId: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors).toBeDefined();
    }
  });
});
