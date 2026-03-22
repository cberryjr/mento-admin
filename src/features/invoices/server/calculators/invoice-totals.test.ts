import { describe, expect, it } from "vitest";

import { calculateInvoiceTotalCents } from "@/features/invoices/server/calculators/invoice-totals";
import type { InvoiceLineItemRecord } from "@/features/invoices/types";

function makeLineItem(overrides: Partial<InvoiceLineItemRecord> = {}): InvoiceLineItemRecord {
  return {
    id: "li-1",
    invoiceId: "inv-1",
    invoiceSectionId: "section-1",
    studioId: "studio-1",
    name: "Item",
    content: "",
    quantity: 1,
    unitLabel: "unit",
    unitPriceCents: 0,
    lineTotalCents: 0,
    position: 1,
    ...overrides,
  };
}

describe("calculateInvoiceTotalCents", () => {
  it("returns 0 for empty line items", () => {
    expect(calculateInvoiceTotalCents([])).toBe(0);
  });

  it("sums line total cents for a single item", () => {
    const items = [makeLineItem({ lineTotalCents: 5000 })];
    expect(calculateInvoiceTotalCents(items)).toBe(5000);
  });

  it("sums line total cents across multiple items", () => {
    const items = [
      makeLineItem({ id: "li-1", lineTotalCents: 2500 }),
      makeLineItem({ id: "li-2", lineTotalCents: 3750 }),
      makeLineItem({ id: "li-3", lineTotalCents: 1250 }),
    ];
    expect(calculateInvoiceTotalCents(items)).toBe(7500);
  });
});
