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

describe("updateQuoteSections", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  it("returns field errors for invalid section input", async () => {
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { updateQuoteSections } = await import(
      "@/features/quotes/server/actions/update-quote-sections"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    const result = await updateQuoteSections({
      quoteId: quote.id,
      sections: [
        {
          id: "qs-1",
          title: "",
          content: "",
          position: 1,
          lineItems: [],
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.fieldErrors?.["sections.0.title"]).toEqual([
        "Section title is required.",
      ]);
    }
  });

  it("recalculates line totals for successful updates", async () => {
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { updateQuoteSections } = await import(
      "@/features/quotes/server/actions/update-quote-sections"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: "qs-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "sp-1",
        title: "Original",
        content: "",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            quoteId: quote.id,
            quoteSectionId: "qs-1",
            studioId: "default-studio",
            name: "Item",
            content: "",
            quantity: 1,
            unitLabel: "hours",
            unitPriceCents: 5000,
            lineTotalCents: 5000,
            position: 1,
          },
        ],
      },
    ]);

    const result = await updateQuoteSections({
      quoteId: quote.id,
      sections: [
        {
          id: "qs-1",
          title: "Updated",
          content: "Refined",
          position: 1,
          lineItems: [
            {
              id: "li-1",
              name: "Item",
              content: "",
              quantity: 4,
              unitLabel: "hours",
              unitPriceCents: 2500,
              position: 1,
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.sections[0].lineItems[0].lineTotalCents).toBe(
        10000,
      );
    }
  });

  it("rejects cross-studio access with a normalized not-found response", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { updateQuoteSections } = await import(
      "@/features/quotes/server/actions/update-quote-sections"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    vi.mocked(requireSession).mockResolvedValue(setSession("other-studio"));

    const result = await updateQuoteSections({
      quoteId: quote.id,
      sections: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Quote not found.");
    }
  });

  it("rejects non-draft quotes", async () => {
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { updateQuoteSections } = await import(
      "@/features/quotes/server/actions/update-quote-sections"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    const store = (
      globalThis as typeof globalThis & {
        __mentoQuotesStore?: Map<string, QuoteDetailRecord>;
      }
    ).__mentoQuotesStore;
    const storedQuote = store?.get(quote.id);

    if (storedQuote) {
      storedQuote.status = "accepted";
    }

    const result = await updateQuoteSections({
      quoteId: quote.id,
      sections: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Only draft quotes can be edited.");
    }
  });
});
