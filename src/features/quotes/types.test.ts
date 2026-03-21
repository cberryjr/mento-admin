import { describe, expect, it } from "vitest";

import {
  calculateLineTotalCents,
  calculateQuoteTotalCents,
  recalculateQuoteTotals,
  toQuoteSummary,
  type QuoteDetailRecord,
  type QuoteInput,
  type QuoteLineItemInput,
  type QuoteLineItemRecord,
  type QuoteRecord,
  type QuoteSectionInput,
  type QuoteSectionRecord,
  type QuoteSummary,
  type QuoteStatus,
} from "@/features/quotes/types";

describe("Quote types", () => {
  it("QuoteStatus includes expected values", () => {
    const statuses: QuoteStatus[] = ["draft", "accepted", "invoiced"];
    expect(statuses).toHaveLength(3);
  });

  it("QuoteInput accepts valid shape", () => {
    const input: QuoteInput = {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: ["sp-1", "sp-2"],
    };

    expect(input.clientId).toBe("client-1");
    expect(input.selectedServicePackageIds).toHaveLength(2);
    expect(input.terms).toBeUndefined();
  });

  it("QuoteRecord includes all required fields", () => {
    const record: QuoteRecord = {
      id: "q-1",
      studioId: "studio-1",
      clientId: "client-1",
      quoteNumber: "Q-20260319-0001",
      title: "Test Quote",
      status: "draft",
      terms: "",
      selectedServicePackageIds: ["sp-1"],
      createdAt: "2026-03-19T00:00:00.000Z",
      updatedAt: "2026-03-19T00:00:00.000Z",
    };

    expect(record.id).toBe("q-1");
    expect(record.status).toBe("draft");
    expect(record.selectedServicePackageIds).toContain("sp-1");
  });

  it("QuoteLineItemRecord includes all required fields", () => {
    const lineItem: QuoteLineItemRecord = {
      id: "li-1",
      quoteId: "q-1",
      quoteSectionId: "qs-1",
      studioId: "studio-1",
      name: "Design Service",
      content: "Custom design work",
      quantity: 2,
      unitLabel: "hours",
      unitPriceCents: 5000,
      lineTotalCents: 10000,
      position: 1,
    };

    expect(lineItem.id).toBe("li-1");
    expect(lineItem.name).toBe("Design Service");
    expect(lineItem.quantity).toBe(2);
    expect(lineItem.unitPriceCents).toBe(5000);
    expect(lineItem.lineTotalCents).toBe(10000);
  });

  it("QuoteSectionRecord includes all required fields", () => {
    const section: QuoteSectionRecord = {
      id: "qs-1",
      quoteId: "q-1",
      studioId: "studio-1",
      sourceServicePackageId: "sp-1",
      title: "Design Services",
      content: "Custom design work section",
      position: 1,
      lineItems: [],
    };

    expect(section.id).toBe("qs-1");
    expect(section.title).toBe("Design Services");
    expect(section.sourceServicePackageId).toBe("sp-1");
    expect(section.lineItems).toHaveLength(0);
  });

  it("QuoteDetailRecord includes sections and generatedAt", () => {
    const detail: QuoteDetailRecord = {
      id: "q-1",
      studioId: "studio-1",
      clientId: "client-1",
      quoteNumber: "Q-20260319-0001",
      title: "Test Quote",
      status: "draft",
      terms: "",
      selectedServicePackageIds: ["sp-1"],
      generatedAt: "2026-03-19T01:00:00.000Z",
      createdAt: "2026-03-19T00:00:00.000Z",
      updatedAt: "2026-03-19T01:00:00.000Z",
      sections: [],
    };

    expect(detail.generatedAt).toBe("2026-03-19T01:00:00.000Z");
    expect(detail.sections).toHaveLength(0);
  });

  it("QuoteDetailRecord with null generatedAt for non-generated quote", () => {
    const detail: QuoteDetailRecord = {
      id: "q-1",
      studioId: "studio-1",
      clientId: "client-1",
      quoteNumber: "Q-20260319-0001",
      title: "Test Quote",
      status: "draft",
      terms: "",
      selectedServicePackageIds: ["sp-1"],
      generatedAt: null,
      createdAt: "2026-03-19T00:00:00.000Z",
      updatedAt: "2026-03-19T00:00:00.000Z",
      sections: [],
    };

    expect(detail.generatedAt).toBeNull();
  });

  it("calculateQuoteTotalCents sums all line item totals", () => {
    const sections: QuoteSectionRecord[] = [
      {
        id: "qs-1",
        quoteId: "q-1",
        studioId: "studio-1",
        sourceServicePackageId: "sp-1",
        title: "Section 1",
        content: "",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            quoteId: "q-1",
            quoteSectionId: "qs-1",
            studioId: "studio-1",
            name: "Item 1",
            content: "",
            quantity: 2,
            unitLabel: "hours",
            unitPriceCents: 5000,
            lineTotalCents: 10000,
            position: 1,
          },
          {
            id: "li-2",
            quoteId: "q-1",
            quoteSectionId: "qs-1",
            studioId: "studio-1",
            name: "Item 2",
            content: "",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 15000,
            lineTotalCents: 15000,
            position: 2,
          },
        ],
      },
      {
        id: "qs-2",
        quoteId: "q-1",
        studioId: "studio-1",
        sourceServicePackageId: "sp-2",
        title: "Section 2",
        content: "",
        position: 2,
        lineItems: [
          {
            id: "li-3",
            quoteId: "q-1",
            quoteSectionId: "qs-2",
            studioId: "studio-1",
            name: "Item 3",
            content: "",
            quantity: 3,
            unitLabel: "units",
            unitPriceCents: 1000,
            lineTotalCents: 3000,
            position: 1,
          },
        ],
      },
    ];

    expect(calculateQuoteTotalCents(sections)).toBe(28000);
  });

  it("calculateQuoteTotalCents returns 0 for empty sections", () => {
    expect(calculateQuoteTotalCents([])).toBe(0);
  });

  it("QuoteSectionInput and QuoteLineItemInput accept editing input shapes", () => {
    const lineItemInput: QuoteLineItemInput = {
      name: "Logo design",
      content: "3 concepts",
      quantity: 2,
      unitLabel: "hours",
      unitPriceCents: 5000,
      position: 1,
    };
    const sectionInput: QuoteSectionInput = {
      id: "qs-1",
      sourceServicePackageId: "sp-1",
      title: "Branding",
      content: "Brand direction",
      position: 1,
      lineItems: [lineItemInput],
    };

    expect(sectionInput.lineItems[0].quantity).toBe(2);
    expect(sectionInput.sourceServicePackageId).toBe("sp-1");
  });

  it("calculateLineTotalCents multiplies quantity by unit price", () => {
    expect(calculateLineTotalCents(3, 4500)).toBe(13500);
  });

  it("recalculateQuoteTotals refreshes line totals and positions", () => {
    const sections: QuoteSectionRecord[] = [
      {
        id: "qs-1",
        quoteId: "q-1",
        studioId: "studio-1",
        sourceServicePackageId: "sp-1",
        title: "Section 1",
        content: "",
        position: 7,
        lineItems: [
          {
            id: "li-1",
            quoteId: "q-1",
            quoteSectionId: "qs-1",
            studioId: "studio-1",
            name: "Item 1",
            content: "",
            quantity: 3,
            unitLabel: "hours",
            unitPriceCents: 2000,
            lineTotalCents: 1,
            position: 9,
          },
        ],
      },
    ];

    const recalculated = recalculateQuoteTotals(sections);

    expect(recalculated[0].lineItems[0].lineTotalCents).toBe(6000);
    expect(recalculated[0].lineItems[0].position).toBe(1);
  });

  it("toQuoteSummary extracts summary fields", () => {
    const record: QuoteDetailRecord = {
      id: "q-1",
      studioId: "studio-1",
      clientId: "client-1",
      quoteNumber: "Q-20260319-0001",
      title: "Test Quote",
      status: "draft",
      terms: "Net 30",
      selectedServicePackageIds: ["sp-1"],
      generatedAt: null,
      createdAt: "2026-03-19T00:00:00.000Z",
      updatedAt: "2026-03-19T01:00:00.000Z",
      sections: [],
    };

    const summary: QuoteSummary = toQuoteSummary(record);

    expect(summary.id).toBe("q-1");
    expect(summary.quoteNumber).toBe("Q-20260319-0001");
    expect(summary.title).toBe("Test Quote");
    expect(summary.status).toBe("draft");
    expect(summary.updatedAt).toBe("2026-03-19T01:00:00.000Z");
    expect("terms" in summary).toBe(false);
    expect("clientId" in summary).toBe(false);
  });
});
