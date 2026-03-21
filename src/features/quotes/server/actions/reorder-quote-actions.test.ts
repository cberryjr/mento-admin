import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/errors/app-error";
import { __resetQuotesStore } from "@/features/quotes/server/store/quotes-store";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

function setSession(studioId = "default-studio") {
  return {
    user: {
      id: "owner-1",
      email: "owner@example.com",
      role: "owner" as const,
      studioId,
    },
    expires: new Date(Date.now() + 360000).toISOString(),
  };
}

const SECTION_IDS = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
] as const;

const LINE_ITEM_IDS = [
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
] as const;

describe("reorderQuoteSections", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  it("reorders sections for a draft quote", async () => {
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { reorderQuoteSections } = await import(
      "@/features/quotes/server/actions/reorder-quote-sections"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test",
      selectedServicePackageIds: [],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: SECTION_IDS[0],
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Section A",
        content: "",
        position: 1,
        lineItems: [],
      },
      {
        id: SECTION_IDS[1],
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Section B",
        content: "",
        position: 2,
        lineItems: [],
      },
    ]);

    const result = await reorderQuoteSections(quote.id, [SECTION_IDS[1], SECTION_IDS[0]]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.sections[0].title).toBe("Section B");
      expect(result.data.quote.sections[0].position).toBe(1);
      expect(result.data.quote.sections[1].title).toBe("Section A");
      expect(result.data.quote.sections[1].position).toBe(2);
    }
  });

  it("rejects invalid section IDs", async () => {
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { reorderQuoteSections } = await import(
      "@/features/quotes/server/actions/reorder-quote-sections"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test",
      selectedServicePackageIds: [],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: SECTION_IDS[0],
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Section A",
        content: "",
        position: 1,
        lineItems: [],
      },
    ]);

    const result = await reorderQuoteSections(quote.id, [SECTION_IDS[1]]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/do not belong/);
    }
  });

  it("rejects cross-studio access", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { reorderQuoteSections } = await import(
      "@/features/quotes/server/actions/reorder-quote-sections"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test",
      selectedServicePackageIds: [],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: SECTION_IDS[0],
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Section A",
        content: "",
        position: 1,
        lineItems: [],
      },
    ]);

    vi.mocked(requireSession).mockResolvedValue(setSession("other-studio"));

    const result = await reorderQuoteSections(quote.id, [SECTION_IDS[0]]);

    expect(result.ok).toBe(false);
  });

  it("rejects non-draft quotes", async () => {
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { reorderQuoteSections } = await import(
      "@/features/quotes/server/actions/reorder-quote-sections"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test",
      selectedServicePackageIds: [],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: SECTION_IDS[0],
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Section A",
        content: "",
        position: 1,
        lineItems: [],
      },
    ]);

    const store = (
      globalThis as typeof globalThis & {
        __mentoQuotesStore?: Map<string, unknown>;
      }
    ).__mentoQuotesStore;
    const storedQuote = store?.get(quote.id) as { status: string } | undefined;

    if (storedQuote) {
      storedQuote.status = "accepted";
    }

    const result = await reorderQuoteSections(quote.id, [SECTION_IDS[0]]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/draft/);
    }
  });

  it("rejects unauthenticated access", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockRejectedValue(
      new AppError("UNAUTHORIZED", "You must sign in."),
    );

    const { reorderQuoteSections } = await import(
      "@/features/quotes/server/actions/reorder-quote-sections"
    );

    const result = await reorderQuoteSections(
      "77777777-7777-4777-8777-777777777777",
      [SECTION_IDS[0]],
    );

    expect(result.ok).toBe(false);
  });

  it("rejects empty reorder payloads", async () => {
    const { reorderQuoteSections } = await import(
      "@/features/quotes/server/actions/reorder-quote-sections"
    );

    const result = await reorderQuoteSections(
      "77777777-7777-4777-8777-777777777777",
      [],
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/At least one item/i);
    }
  });
});

describe("reorderQuoteLineItems", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  it("reorders line items within a section", async () => {
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { reorderQuoteLineItems } = await import(
      "@/features/quotes/server/actions/reorder-quote-line-items"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test",
      selectedServicePackageIds: [],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: SECTION_IDS[0],
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Section A",
        content: "",
        position: 1,
        lineItems: [
          {
            id: LINE_ITEM_IDS[0],
            quoteId: quote.id,
            quoteSectionId: SECTION_IDS[0],
            studioId: "default-studio",
            name: "Item A",
            content: "",
            quantity: 1,
            unitLabel: "",
            unitPriceCents: 1000,
            lineTotalCents: 1000,
            position: 1,
          },
          {
            id: LINE_ITEM_IDS[1],
            quoteId: quote.id,
            quoteSectionId: SECTION_IDS[0],
            studioId: "default-studio",
            name: "Item B",
            content: "",
            quantity: 1,
            unitLabel: "",
            unitPriceCents: 2000,
            lineTotalCents: 2000,
            position: 2,
          },
        ],
      },
    ]);

    const result = await reorderQuoteLineItems(quote.id, SECTION_IDS[0], [
      LINE_ITEM_IDS[1],
      LINE_ITEM_IDS[0],
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const items = result.data.quote.sections[0].lineItems;
      expect(items[0].name).toBe("Item B");
      expect(items[0].position).toBe(1);
      expect(items[1].name).toBe("Item A");
      expect(items[1].position).toBe(2);
    }
  });

  it("rejects line items not in section", async () => {
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { reorderQuoteLineItems } = await import(
      "@/features/quotes/server/actions/reorder-quote-line-items"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test",
      selectedServicePackageIds: [],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: SECTION_IDS[0],
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Section A",
        content: "",
        position: 1,
        lineItems: [
          {
            id: LINE_ITEM_IDS[0],
            quoteId: quote.id,
            quoteSectionId: SECTION_IDS[0],
            studioId: "default-studio",
            name: "Item A",
            content: "",
            quantity: 1,
            unitLabel: "",
            unitPriceCents: 1000,
            lineTotalCents: 1000,
            position: 1,
          },
        ],
      },
    ]);

    const result = await reorderQuoteLineItems(quote.id, SECTION_IDS[0], [LINE_ITEM_IDS[1]]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/do not belong/);
    }
  });

  it("rejects empty line item reorder payloads", async () => {
    const { reorderQuoteLineItems } = await import(
      "@/features/quotes/server/actions/reorder-quote-line-items"
    );

    const result = await reorderQuoteLineItems(
      "77777777-7777-4777-8777-777777777777",
      SECTION_IDS[0],
      [],
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/At least one item/i);
    }
  });
});
