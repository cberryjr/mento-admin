import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetQuotesStore,
  createQuoteInStore,
  readQuoteByIdFromStore,
  readQuoteFromStore,
  readQuotesFromStore,
  readQuoteSummariesForClientFromStore,
  updateQuoteInStore,
} from "@/features/quotes/server/store/quotes-store";

beforeEach(() => {
  __resetQuotesStore();
});

describe("quotes-store", () => {
  const studioId = "default-studio";
  const otherStudioId = "other-studio";

  const baseInput = {
    clientId: "client-1",
    title: "Test Quote",
    selectedServicePackageIds: ["sp-1", "sp-2"],
    terms: "Net 30",
  };

  it("createQuoteInStore creates a record with generated id and quoteNumber", () => {
    const quote = createQuoteInStore(studioId, baseInput);

    expect(quote.id).toBeTruthy();
    expect(quote.studioId).toBe(studioId);
    expect(quote.clientId).toBe("client-1");
    expect(quote.title).toBe("Test Quote");
    expect(quote.status).toBe("draft");
    expect(quote.quoteNumber).toMatch(/^Q-\d{8}-[A-F0-9]{8}$/);
    expect(quote.selectedServicePackageIds).toEqual(["sp-1", "sp-2"]);
    expect(quote.createdAt).toBeTruthy();
    expect(quote.updatedAt).toBeTruthy();
  });

  it("readQuotesFromStore returns only quotes for the given studio", () => {
    createQuoteInStore(studioId, baseInput);
    createQuoteInStore(otherStudioId, {
      ...baseInput,
      title: "Other Quote",
    });

    const quotes = readQuotesFromStore(studioId);
    expect(quotes).toHaveLength(1);
    expect(quotes[0].title).toBe("Test Quote");
  });

  it("readQuoteFromStore enforces studio scoping", () => {
    const quote = createQuoteInStore(studioId, baseInput);

    expect(readQuoteFromStore(studioId, quote.id)).not.toBeNull();
    expect(readQuoteFromStore(otherStudioId, quote.id)).toBeNull();
  });

  it("readQuoteByIdFromStore does not enforce studio scoping", () => {
    const quote = createQuoteInStore(studioId, baseInput);

    expect(readQuoteByIdFromStore(quote.id)).not.toBeNull();
  });

  it("updateQuoteInStore updates the record and preserves id", () => {
    const quote = createQuoteInStore(studioId, baseInput);

    const updated = updateQuoteInStore(studioId, quote.id, {
      ...baseInput,
      title: "Updated Title",
    });

    expect(updated).not.toBeNull();
    expect(updated!.id).toBe(quote.id);
    expect(updated!.title).toBe("Updated Title");
    expect(updated!.quoteNumber).toBe(quote.quoteNumber);
  });

  it("updateQuoteInStore returns null for wrong studio", () => {
    const quote = createQuoteInStore(studioId, baseInput);

    const result = updateQuoteInStore(otherStudioId, quote.id, baseInput);
    expect(result).toBeNull();
  });

  it("readQuoteSummariesForClientFromStore filters by client", () => {
    createQuoteInStore(studioId, baseInput);
    createQuoteInStore(studioId, {
      ...baseInput,
      clientId: "client-2",
      title: "Other Client Quote",
    });

    const summaries = readQuoteSummariesForClientFromStore(
      studioId,
      "client-1",
    );
    expect(summaries).toHaveLength(1);
    expect(summaries[0].title).toBe("Test Quote");
  });

  it("returns deep copies that do not share references", () => {
    const quote = createQuoteInStore(studioId, baseInput);
    const copy1 = readQuoteByIdFromStore(quote.id)!;
    const copy2 = readQuoteByIdFromStore(quote.id)!;

    expect(copy1).not.toBe(copy2);
    expect(copy1.selectedServicePackageIds).not.toBe(
      copy2.selectedServicePackageIds,
    );
  });

  it("__resetQuotesStore clears all quotes", () => {
    createQuoteInStore(studioId, baseInput);
    expect(readQuotesFromStore(studioId)).toHaveLength(1);

    __resetQuotesStore();
    expect(readQuotesFromStore(studioId)).toHaveLength(0);
  });
});
