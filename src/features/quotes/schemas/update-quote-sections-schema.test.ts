import { describe, expect, it } from "vitest";

import {
  updateQuoteLineItemSchema,
  updateQuoteSectionSchema,
  updateQuoteSectionsSchema,
  getUpdateQuoteSectionsFieldErrors,
  addQuoteSectionSchema,
  removeQuoteSectionSchema,
  addQuoteLineItemSchema,
  removeQuoteLineItemSchema,
  reorderQuoteSectionsSchema,
  reorderQuoteLineItemsSchema,
} from "@/features/quotes/schemas/update-quote-sections-schema";

describe("updateQuoteLineItemSchema", () => {
  it("accepts valid line item input", () => {
    const result = updateQuoteLineItemSchema.safeParse({
      name: "Logo Design",
      content: "Custom logo",
      quantity: 2,
      unitLabel: "hours",
      unitPriceCents: 5000,
      position: 1,
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = updateQuoteLineItemSchema.safeParse({
      name: "",
      content: "",
      quantity: 1,
      unitLabel: "",
      unitPriceCents: 0,
      position: 1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects quantity less than 1", () => {
    const result = updateQuoteLineItemSchema.safeParse({
      name: "Item",
      content: "",
      quantity: 0,
      unitLabel: "",
      unitPriceCents: 0,
      position: 1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative unitPriceCents", () => {
    const result = updateQuoteLineItemSchema.safeParse({
      name: "Item",
      content: "",
      quantity: 1,
      unitLabel: "",
      unitPriceCents: -100,
      position: 1,
    });

    expect(result.success).toBe(false);
  });
});

describe("updateQuoteSectionSchema", () => {
  it("accepts valid section input", () => {
    const result = updateQuoteSectionSchema.safeParse({
      title: "Design Services",
      content: "Custom design",
      position: 1,
      lineItems: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = updateQuoteSectionSchema.safeParse({
      title: "",
      content: "",
      position: 1,
      lineItems: [],
    });

    expect(result.success).toBe(false);
  });
});

describe("updateQuoteSectionsSchema", () => {
  it("accepts valid sections array", () => {
    const result = updateQuoteSectionsSchema.safeParse({
      quoteId: "q-1",
      sections: [
        {
          title: "Section 1",
          content: "",
          position: 1,
          lineItems: [
            {
              name: "Item 1",
              content: "",
              quantity: 1,
              unitLabel: "item",
              unitPriceCents: 1000,
              position: 1,
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty quoteId", () => {
    const result = updateQuoteSectionsSchema.safeParse({
      quoteId: "",
      sections: [],
    });

    expect(result.success).toBe(false);
  });

  it("maps field errors correctly", () => {
    const result = updateQuoteSectionsSchema.safeParse({
      quoteId: "",
      sections: [
        {
          title: "",
          content: "",
          position: 1,
          lineItems: [],
        },
      ],
    });

    if (!result.success) {
      const errors = getUpdateQuoteSectionsFieldErrors(result.error);
      expect(Object.keys(errors).length).toBeGreaterThan(0);
    }
  });
});

describe("add/remove schemas", () => {
  it("addQuoteSectionSchema accepts valid input", () => {
    const result = addQuoteSectionSchema.safeParse({ quoteId: "q-1" });
    expect(result.success).toBe(true);
  });

  it("removeQuoteSectionSchema accepts valid input", () => {
    const result = removeQuoteSectionSchema.safeParse({
      quoteId: "q-1",
      sectionId: "s-1",
    });
    expect(result.success).toBe(true);
  });

  it("addQuoteLineItemSchema accepts valid input", () => {
    const result = addQuoteLineItemSchema.safeParse({
      quoteId: "q-1",
      sectionId: "s-1",
    });
    expect(result.success).toBe(true);
  });

  it("removeQuoteLineItemSchema accepts valid input", () => {
    const result = removeQuoteLineItemSchema.safeParse({
      quoteId: "q-1",
      sectionId: "s-1",
      lineItemId: "li-1",
    });
    expect(result.success).toBe(true);
  });
});

describe("reorder schemas", () => {
  const quoteId = "11111111-1111-4111-8111-111111111111";
  const sectionId = "22222222-2222-4222-8222-222222222222";

  it("reorderQuoteSectionsSchema accepts valid input", () => {
    const result = reorderQuoteSectionsSchema.safeParse({
      quoteId,
      sectionIds: [
        sectionId,
        "33333333-3333-4333-8333-333333333333",
        "44444444-4444-4444-8444-444444444444",
      ],
    });
    expect(result.success).toBe(true);
  });

  it("reorderQuoteSectionsSchema rejects empty array", () => {
    const result = reorderQuoteSectionsSchema.safeParse({
      quoteId,
      sectionIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("reorderQuoteSectionsSchema rejects duplicate IDs", () => {
    const result = reorderQuoteSectionsSchema.safeParse({
      quoteId,
      sectionIds: [sectionId, sectionId],
    });
    expect(result.success).toBe(false);
  });

  it("reorderQuoteSectionsSchema rejects non-UUID values", () => {
    const result = reorderQuoteSectionsSchema.safeParse({
      quoteId,
      sectionIds: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });

  it("reorderQuoteLineItemsSchema accepts valid input", () => {
    const result = reorderQuoteLineItemsSchema.safeParse({
      quoteId,
      sectionId,
      lineItemIds: [
        "55555555-5555-4555-8555-555555555555",
        "66666666-6666-4666-8666-666666666666",
      ],
    });
    expect(result.success).toBe(true);
  });

  it("reorderQuoteLineItemsSchema rejects empty array", () => {
    const result = reorderQuoteLineItemsSchema.safeParse({
      quoteId,
      sectionId,
      lineItemIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("reorderQuoteLineItemsSchema rejects duplicate IDs", () => {
    const result = reorderQuoteLineItemsSchema.safeParse({
      quoteId,
      sectionId,
      lineItemIds: [
        "55555555-5555-4555-8555-555555555555",
        "55555555-5555-4555-8555-555555555555",
      ],
    });
    expect(result.success).toBe(false);
  });

  it("reorderQuoteLineItemsSchema rejects non-UUID values", () => {
    const result = reorderQuoteLineItemsSchema.safeParse({
      quoteId,
      sectionId,
      lineItemIds: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });
});
