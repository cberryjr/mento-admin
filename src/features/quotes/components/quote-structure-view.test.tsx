import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import type { QuoteSectionRecord } from "@/features/quotes/types";

afterEach(() => {
  cleanup();
});

describe("QuoteStructureView", () => {
  it("renders empty state when no sections", async () => {
    const { QuoteStructureView } = await import(
      "@/features/quotes/components/quote-structure-view"
    );

    render(<QuoteStructureView sections={[]} />);

    expect(screen.getByText(/no sections generated yet/i)).toBeInTheDocument();
  });

  it("renders sections with line items and totals", async () => {
    const { QuoteStructureView } = await import(
      "@/features/quotes/components/quote-structure-view"
    );

    const sections: QuoteSectionRecord[] = [
      {
        id: "qs-1",
        quoteId: "q-1",
        studioId: "studio-1",
        sourceServicePackageId: "sp-1",
        title: "Design Services",
        content: "Custom design work",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            quoteId: "q-1",
            quoteSectionId: "qs-1",
            studioId: "studio-1",
            name: "Logo Design",
            content: "3 concepts",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 50000,
            lineTotalCents: 50000,
            position: 1,
          },
          {
            id: "li-2",
            quoteId: "q-1",
            quoteSectionId: "qs-1",
            studioId: "studio-1",
            name: "Brand Guide",
            content: "Style guide document",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 30000,
            lineTotalCents: 30000,
            position: 2,
          },
        ],
      },
    ];

    render(<QuoteStructureView sections={sections} />);

    expect(screen.getByText("Design Services")).toBeInTheDocument();
    expect(screen.getByText("Custom design work")).toBeInTheDocument();
    expect(screen.getByText("Logo Design")).toBeInTheDocument();
    expect(screen.getByText("3 concepts")).toBeInTheDocument();
    expect(screen.getByText("Brand Guide")).toBeInTheDocument();
    expect(screen.getAllByText("$500.00")).toHaveLength(2);
    expect(screen.getAllByText("$300.00")).toHaveLength(2);
    expect(screen.getAllByText("$800.00")).toHaveLength(2);
  });

  it("renders grand total across multiple sections", async () => {
    const { QuoteStructureView } = await import(
      "@/features/quotes/components/quote-structure-view"
    );

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
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 10000,
            lineTotalCents: 10000,
            position: 1,
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
            id: "li-2",
            quoteId: "q-1",
            quoteSectionId: "qs-2",
            studioId: "studio-1",
            name: "Item 2",
            content: "",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 20000,
            lineTotalCents: 20000,
            position: 1,
          },
        ],
      },
    ];

    render(<QuoteStructureView sections={sections} />);

    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByText("Section 2")).toBeInTheDocument();
    expect(screen.getAllByText("Grand total")).toHaveLength(1);
    expect(screen.getByText("$300.00")).toBeInTheDocument();
  });

  it("renders section with no line items", async () => {
    const { QuoteStructureView } = await import(
      "@/features/quotes/components/quote-structure-view"
    );

    const sections: QuoteSectionRecord[] = [
      {
        id: "qs-1",
        quoteId: "q-1",
        studioId: "studio-1",
        sourceServicePackageId: "sp-1",
        title: "Empty Section",
        content: "No line items yet",
        position: 1,
        lineItems: [],
      },
    ];

    render(<QuoteStructureView sections={sections} />);

    expect(screen.getByText("Empty Section")).toBeInTheDocument();
    expect(screen.getByText("No line items yet")).toBeInTheDocument();
    expect(screen.getAllByText("$0.00")).toHaveLength(2);
  });
});
