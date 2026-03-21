export type QuoteStatus = "draft" | "accepted" | "invoiced";

export type QuoteInput = {
  clientId: string;
  title: string;
  selectedServicePackageIds: string[];
  terms?: string;
};

export type QuoteRecord = {
  id: string;
  studioId: string;
  clientId: string;
  quoteNumber: string;
  title: string;
  status: QuoteStatus;
  terms: string;
  selectedServicePackageIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type QuoteLineItemRecord = {
  id: string;
  quoteId: string;
  quoteSectionId: string;
  studioId: string;
  name: string;
  content: string;
  quantity: number;
  unitLabel: string;
  unitPriceCents: number;
  lineTotalCents: number;
  position: number;
};

export type QuoteSectionRecord = {
  id: string;
  quoteId: string;
  studioId: string;
  sourceServicePackageId: string;
  title: string;
  content: string;
  position: number;
  lineItems: QuoteLineItemRecord[];
};

export type QuoteSummary = {
  id: string;
  quoteNumber: string;
  title: string;
  status: QuoteStatus;
  updatedAt: string;
};

export type QuoteDetailRecord = QuoteRecord & {
  generatedAt: string | null;
  sections: QuoteSectionRecord[];
};

export type QuoteLineItemInput = {
  id?: string;
  name: string;
  content: string;
  quantity: number;
  unitLabel: string;
  unitPriceCents: number;
  position: number;
};

export type QuoteSectionInput = {
  id?: string;
  sourceServicePackageId?: string;
  title: string;
  content: string;
  position: number;
  lineItems: QuoteLineItemInput[];
};

export type UpdateQuoteSectionsInput = {
  quoteId: string;
  sections: QuoteSectionInput[];
};

export function calculateLineTotalCents(
  quantity: number,
  unitPriceCents: number,
): number {
  return quantity * unitPriceCents;
}

export function recalculateQuoteTotals(
  sections: QuoteSectionRecord[],
): QuoteSectionRecord[] {
  return sections.map((section, sectionIndex) => ({
    ...section,
    position: sectionIndex + 1,
    lineItems: section.lineItems.map((li, lineItemIndex) => ({
      ...li,
      position: lineItemIndex + 1,
      lineTotalCents: calculateLineTotalCents(
        li.quantity,
        li.unitPriceCents,
      ),
    })),
  }));
}

export function toQuoteSummary(quote: QuoteRecord): QuoteSummary {
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    title: quote.title,
    status: quote.status,
    updatedAt: quote.updatedAt,
  };
}

export function calculateQuoteTotalCents(sections: QuoteSectionRecord[]): number {
  return sections.reduce((total, section) => {
    return (
      total +
      section.lineItems.reduce((sectionTotal, lineItem) => {
        return sectionTotal + lineItem.lineTotalCents;
      }, 0)
    );
  }, 0);
}
