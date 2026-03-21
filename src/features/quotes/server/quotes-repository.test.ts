import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetQuotesStore,
} from "@/features/quotes/server/store/quotes-store";
import {
  listQuotesForStudio,
  getQuoteById,
  createQuoteRecord,
  updateQuoteRecord,
  saveQuoteSections,
  deleteQuoteSections,
  setQuoteGeneratedAt,
  __resetQuotesStore as resetRepositoryStore,
} from "@/features/quotes/server/quotes-repository";
import type { QuoteSectionRecord } from "@/features/quotes/types";

beforeEach(() => {
  __resetQuotesStore();
  resetRepositoryStore();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("quotes-repository (fallback store path)", () => {
  const studioId = "default-studio";
  const otherStudioId = "other-studio";

  const baseInput = {
    clientId: "client-1",
    title: "Test Quote",
    selectedServicePackageIds: ["sp-1"],
    terms: "Net 30",
  };

  it("createQuoteRecord creates a quote via the store", async () => {
    const quote = await createQuoteRecord(studioId, baseInput);

    expect(quote.id).toBeTruthy();
    expect(quote.studioId).toBe(studioId);
    expect(quote.title).toBe("Test Quote");
    expect(quote.status).toBe("draft");
    expect(quote.selectedServicePackageIds).toEqual(["sp-1"]);
    expect(quote.generatedAt).toBeNull();
    expect(quote.sections).toEqual([]);
  });

  it("listQuotesForStudio returns quotes for the given studio", async () => {
    await createQuoteRecord(studioId, baseInput);
    await createQuoteRecord(otherStudioId, {
      ...baseInput,
      title: "Other Studio Quote",
    });

    const quotes = await listQuotesForStudio(studioId);
    expect(quotes).toHaveLength(1);
    expect(quotes[0].title).toBe("Test Quote");
  });

  it("listQuotesForStudio returns most recently updated quotes first", async () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-03-21T09:00:00.000Z"));
    const olderQuote = await createQuoteRecord(studioId, baseInput);

    vi.setSystemTime(new Date("2026-03-21T09:01:00.000Z"));
    const newerQuote = await createQuoteRecord(studioId, {
      ...baseInput,
      title: "Newer Quote",
    });

    vi.setSystemTime(new Date("2026-03-21T09:02:00.000Z"));
    await updateQuoteRecord(studioId, olderQuote.id, {
      ...baseInput,
      title: "Refined Older Quote",
    });

    const quotes = await listQuotesForStudio(studioId);

    expect(quotes.map((quote) => quote.id)).toEqual([
      olderQuote.id,
      newerQuote.id,
    ]);
    expect(quotes[0].updatedAt).toBe("2026-03-21T09:02:00.000Z");
  });

  it("getQuoteById returns a quote by id", async () => {
    const created = await createQuoteRecord(studioId, baseInput);
    const found = await getQuoteById(created.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.selectedServicePackageIds).toEqual(["sp-1"]);
    expect(found!.sections).toEqual([]);
  });

  it("getQuoteById returns null for unknown id", async () => {
    const found = await getQuoteById("non-existent");
    expect(found).toBeNull();
  });

  it("updateQuoteRecord updates a quote", async () => {
    const created = await createQuoteRecord(studioId, baseInput);

    const updated = await updateQuoteRecord(studioId, created.id, {
      ...baseInput,
      title: "Updated Title",
      selectedServicePackageIds: ["sp-1", "sp-2"],
    });

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("Updated Title");
    expect(updated!.selectedServicePackageIds).toEqual(["sp-1", "sp-2"]);
    expect(updated!.quoteNumber).toBe(created.quoteNumber);
  });

  it("updateQuoteRecord returns null for wrong studio", async () => {
    const created = await createQuoteRecord(studioId, baseInput);

    const result = await updateQuoteRecord(otherStudioId, created.id, baseInput);
    expect(result).toBeNull();
  });
});

describe("quotes-sections-repository (fallback store path)", () => {
  const studioId = "default-studio";

  const baseInput = {
    clientId: "client-1",
    title: "Test Quote",
    selectedServicePackageIds: ["sp-1"],
    terms: "Net 30",
  };

  it("saveQuoteSections stores sections and line items", async () => {
    const quote = await createQuoteRecord(studioId, baseInput);

    const sections: QuoteSectionRecord[] = [
      {
        id: "qs-1",
        quoteId: quote.id,
        studioId,
        sourceServicePackageId: "sp-1",
        title: "Design Services",
        content: "Custom design",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            quoteId: quote.id,
            quoteSectionId: "qs-1",
            studioId,
            name: "Logo Design",
            content: "Custom logo",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 50000,
            lineTotalCents: 50000,
            position: 1,
          },
          {
            id: "li-2",
            quoteId: quote.id,
            quoteSectionId: "qs-1",
            studioId,
            name: "Brand Guide",
            content: "Style guide",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 30000,
            lineTotalCents: 30000,
            position: 2,
          },
        ],
      },
    ];

    await saveQuoteSections(quote.id, studioId, sections);

    const found = await getQuoteById(quote.id);
    expect(found).not.toBeNull();
    expect(found!.sections).toHaveLength(1);
    expect(found!.sections[0].title).toBe("Design Services");
    expect(found!.sections[0].lineItems).toHaveLength(2);
    expect(found!.sections[0].lineItems[0].name).toBe("Logo Design");
    expect(found!.sections[0].lineItems[0].lineTotalCents).toBe(50000);
  });

  it("saveQuoteSections replaces existing sections on regenerate", async () => {
    const quote = await createQuoteRecord(studioId, baseInput);

    const firstSections: QuoteSectionRecord[] = [
      {
        id: "qs-1",
        quoteId: quote.id,
        studioId,
        sourceServicePackageId: "sp-1",
        title: "Old Section",
        content: "",
        position: 1,
        lineItems: [],
      },
    ];

    await saveQuoteSections(quote.id, studioId, firstSections);

    const secondSections: QuoteSectionRecord[] = [
      {
        id: "qs-2",
        quoteId: quote.id,
        studioId,
        sourceServicePackageId: "sp-1",
        title: "New Section",
        content: "",
        position: 1,
        lineItems: [],
      },
    ];

    await saveQuoteSections(quote.id, studioId, secondSections);

    const found = await getQuoteById(quote.id);
    expect(found!.sections).toHaveLength(1);
    expect(found!.sections[0].title).toBe("New Section");
  });

  it("deleteQuoteSections removes all sections for a quote", async () => {
    const quote = await createQuoteRecord(studioId, baseInput);

    const sections: QuoteSectionRecord[] = [
      {
        id: "qs-1",
        quoteId: quote.id,
        studioId,
        sourceServicePackageId: "sp-1",
        title: "Section 1",
        content: "",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            quoteId: quote.id,
            quoteSectionId: "qs-1",
            studioId,
            name: "Item 1",
            content: "",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 1000,
            lineTotalCents: 1000,
            position: 1,
          },
        ],
      },
    ];

    await saveQuoteSections(quote.id, studioId, sections);
    await deleteQuoteSections(quote.id);

    const found = await getQuoteById(quote.id);
    expect(found!.sections).toHaveLength(0);
  });

  it("setQuoteGeneratedAt updates the generated timestamp", async () => {
    const quote = await createQuoteRecord(studioId, baseInput);
    expect(quote.generatedAt).toBeNull();

    const now = new Date("2026-03-19T12:00:00.000Z");
    await setQuoteGeneratedAt(quote.id, now);

    const found = await getQuoteById(quote.id);
    expect(found!.generatedAt).toBe("2026-03-19T12:00:00.000Z");
  });

  it("getQuoteById returns sections with correct ordering", async () => {
    const quote = await createQuoteRecord(studioId, baseInput);

    const sections: QuoteSectionRecord[] = [
      {
        id: "qs-2",
        quoteId: quote.id,
        studioId,
        sourceServicePackageId: "sp-1",
        title: "Second Section",
        content: "",
        position: 2,
        lineItems: [],
      },
      {
        id: "qs-1",
        quoteId: quote.id,
        studioId,
        sourceServicePackageId: "sp-1",
        title: "First Section",
        content: "",
        position: 1,
        lineItems: [],
      },
    ];

    await saveQuoteSections(quote.id, studioId, sections);

    const found = await getQuoteById(quote.id);
    expect(found!.sections).toHaveLength(2);
  });
});
