import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession } from "@/features/auth/session";
import { __resetClientsStore } from "@/features/clients/server/clients-repository";
import { __resetQuotesStore } from "@/features/quotes/server/store/quotes-store";

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

describe("correctQuoteData", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetClientsStore();
    __resetQuotesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  async function seedQuote() {
    const clientsRepo = await import("@/features/clients/server/clients-repository");
    const quotesRepo = await import("@/features/quotes/server/quotes-repository");

    const primaryClient = await clientsRepo.createClientRecord("default-studio", {
      name: "Sunrise Yoga Studio",
      contactName: "Avery Patel",
      contactEmail: "ops@sunriseyoga.example",
      contactPhone: "+1 555 0101",
    });
    const secondaryClient = await clientsRepo.createClientRecord("default-studio", {
      name: "Moonrise Pilates",
      contactName: "Jordan Lee",
      contactEmail: "hello@moonrise.example",
      contactPhone: "+1 555 0102",
    });
    const otherStudioClient = await clientsRepo.createClientRecord("other-studio", {
      name: "Cross Studio",
      contactName: "Morgan Doe",
      contactEmail: "cross@example.com",
      contactPhone: "+1 555 0103",
    });

    const quote = await quotesRepo.createQuoteRecord("default-studio", {
      clientId: primaryClient.id,
      title: "Spring launch quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "Net 15",
    });

    await quotesRepo.saveQuoteSections(quote.id, "default-studio", [
      {
        id: "section-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "sp-1",
        title: "Discovery",
        content: "Original scope",
        position: 1,
        lineItems: [
          {
            id: "line-item-1",
            quoteId: quote.id,
            quoteSectionId: "section-1",
            studioId: "default-studio",
            name: "Workshop",
            content: "Kickoff session",
            quantity: 1,
            unitLabel: "session",
            unitPriceCents: 125000,
            lineTotalCents: 125000,
            position: 1,
          },
        ],
      },
    ]);

    return { quote, primaryClient, secondaryClient, otherStudioClient };
  }

  it("corrects client data successfully", async () => {
    const { quote, secondaryClient } = await seedQuote();
    const { correctQuoteData } = await import(
      "@/features/quotes/server/actions/correct-quote-data"
    );

    const result = await correctQuoteData({
      quoteId: quote.id,
      corrections: {
        clientId: secondaryClient.id,
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.clientId).toBe(secondaryClient.id);
    }
  });

  it("corrects section content successfully", async () => {
    const { quote } = await seedQuote();
    const { correctQuoteData } = await import(
      "@/features/quotes/server/actions/correct-quote-data"
    );

    const result = await correctQuoteData({
      quoteId: quote.id,
      corrections: {
        sections: [
          {
            id: "section-1",
            title: "Discovery and alignment",
            description: "Updated scope details",
            lineItems: [
              {
                id: "line-item-1",
                description: "Updated kickoff session",
              },
            ],
          },
        ],
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.sections[0].title).toBe("Discovery and alignment");
      expect(result.data.quote.sections[0].content).toBe("Updated scope details");
      expect(result.data.quote.sections[0].lineItems[0].content).toBe(
        "Updated kickoff session",
      );
    }
  });

  it("corrects line items and recalculates totals", async () => {
    const { quote } = await seedQuote();
    const { correctQuoteData } = await import(
      "@/features/quotes/server/actions/correct-quote-data"
    );

    const result = await correctQuoteData({
      quoteId: quote.id,
      corrections: {
        sections: [
          {
            id: "section-1",
            lineItems: [
              {
                id: "line-item-1",
                quantity: 2,
                unitPriceCents: 150000,
              },
            ],
          },
        ],
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.sections[0].lineItems[0].quantity).toBe(2);
      expect(result.data.quote.sections[0].lineItems[0].unitPriceCents).toBe(150000);
      expect(result.data.quote.sections[0].lineItems[0].lineTotalCents).toBe(300000);
    }
  });

  it("corrects pricing values and recalculates totals", async () => {
    const { quote } = await seedQuote();
    const { correctQuoteData } = await import(
      "@/features/quotes/server/actions/correct-quote-data"
    );

    const result = await correctQuoteData({
      quoteId: quote.id,
      corrections: {
        sections: [
          {
            id: "section-1",
            lineItems: [
              {
                id: "line-item-1",
                unitPriceCents: 99000,
              },
            ],
          },
        ],
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.sections[0].lineItems[0].lineTotalCents).toBe(99000);
    }
  });

  it("corrects terms and allowed status changes", async () => {
    const { quote } = await seedQuote();
    const { correctQuoteData } = await import(
      "@/features/quotes/server/actions/correct-quote-data"
    );

    const result = await correctQuoteData({
      quoteId: quote.id,
      corrections: {
        terms: "Net 30 with deposit",
        status: "accepted",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.terms).toBe("Net 30 with deposit");
      expect(result.data.quote.status).toBe("accepted");
    }
  });

  it("returns validation error for invalid input", async () => {
    const { quote, otherStudioClient } = await seedQuote();
    const { correctQuoteData } = await import(
      "@/features/quotes/server/actions/correct-quote-data"
    );

    const result = await correctQuoteData({
      quoteId: quote.id,
      corrections: {
        clientId: otherStudioClient.id,
        sections: [
          {
            id: "section-1",
            lineItems: [
              {
                id: "line-item-1",
                quantity: 1,
              },
            ],
          },
        ],
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.["corrections.clientId"]).toEqual([
        "Select a client from your studio.",
      ]);
    }
  });

  it("returns unauthorized for wrong studio", async () => {
    const { quote } = await seedQuote();
    const { requireSession } = await import("@/features/auth/require-session");
    const { correctQuoteData } = await import(
      "@/features/quotes/server/actions/correct-quote-data"
    );

    vi.mocked(requireSession).mockResolvedValue(setSession("other-studio"));

    const result = await correctQuoteData({
      quoteId: quote.id,
      corrections: {
        terms: "Updated terms",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Quote not found.");
    }
  });

  it("emits the quote.corrected workflow event", async () => {
    const { quote } = await seedQuote();
    const events = await import("@/features/corrections/server/correction-events");
    const emitEvent = vi.spyOn(events, "emitCorrectionEvent");
    const { correctQuoteData } = await import(
      "@/features/quotes/server/actions/correct-quote-data"
    );

    const result = await correctQuoteData({
      quoteId: quote.id,
      corrections: {
        terms: "Updated terms",
      },
    });

    expect(result.ok).toBe(true);
    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "quote.corrected",
        recordId: quote.id,
        studioId: "default-studio",
      }),
    );
  });

  it("rejects invalid status regressions for invoiced quotes", async () => {
    const { quote } = await seedQuote();
    const { updateQuoteStatus } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { correctQuoteData } = await import(
      "@/features/quotes/server/actions/correct-quote-data"
    );

    await updateQuoteStatus(quote.id, "invoiced");

    const result = await correctQuoteData({
      quoteId: quote.id,
      corrections: {
        status: "draft",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(
        "Invoiced quotes cannot change status during correction.",
      );
    }
  });

  it("returns explicit feedback when quote date correction is requested", async () => {
    const { quote } = await seedQuote();
    const { correctQuoteData } = await import(
      "@/features/quotes/server/actions/correct-quote-data"
    );

    const result = await correctQuoteData({
      quoteId: quote.id,
      corrections: {
        dates: {
          issueDate: "2026-04-01",
          validUntil: "2026-04-30",
        },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.["corrections.dates"]).toEqual([
        "Quote date correction is not available for the current quote model.",
      ]);
    }
  });
});
