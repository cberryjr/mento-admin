import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { QuotePreview } from "@/features/quotes/components/quote-preview";
import type { QuotePreviewPayload } from "@/features/quotes/types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
});

const BASE_PAYLOAD: QuotePreviewPayload = {
  quoteId: "q-1",
  clientId: "client-1",
  quoteNumber: "Q-20260321-ABC12345",
  title: "Brand Identity Package",
  status: "draft",
  clientName: "Acme Corp",
  clientContact: {
    name: "Jane Doe",
    email: "jane@acme.com",
    phone: "555-1234",
  },
  sections: [
    {
      id: "qs-1",
      quoteId: "q-1",
      studioId: "studio-1",
      sourceServicePackageId: "sp-1",
      title: "Design",
      content: "Custom design work",
      position: 1,
      lineItems: [
        {
          id: "li-1",
          quoteId: "q-1",
          quoteSectionId: "qs-1",
          studioId: "studio-1",
          name: "Logo design",
          content: "Primary logo",
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
          name: "Brand guide",
          content: "",
          quantity: 2,
          unitLabel: "copy",
          unitPriceCents: 2500,
          lineTotalCents: 5000,
          position: 2,
        },
      ],
    },
  ],
  grandTotalCents: 55000,
  terms: "Net 30",
  preparedAt: "2026-03-21T12:00:00.000Z",
  studioName: "My Studio",
  estimateBreakdown: null,
};

describe("QuotePreview", () => {
  it("renders the studio name and quote number", () => {
    render(<QuotePreview payload={BASE_PAYLOAD} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(screen.getByText("My Studio")).toBeInTheDocument();
    expect(screen.getByText("Q-20260321-ABC12345")).toBeInTheDocument();
  });

  it("renders the QUOTE heading", () => {
    render(<QuotePreview payload={BASE_PAYLOAD} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(screen.getByRole("heading", { name: "QUOTE", level: 1 })).toBeInTheDocument();
  });

  it("renders the quote title", () => {
    render(<QuotePreview payload={BASE_PAYLOAD} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(
      screen.getByRole("heading", { name: "Brand Identity Package" }),
    ).toBeInTheDocument();
  });

  it("renders client details", () => {
    render(<QuotePreview payload={BASE_PAYLOAD} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@acme.com")).toBeInTheDocument();
    expect(screen.getByText("555-1234")).toBeInTheDocument();
  });

  it("renders section title and content", () => {
    render(<QuotePreview payload={BASE_PAYLOAD} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Custom design work")).toBeInTheDocument();
  });

  it("renders line items table", () => {
    render(<QuotePreview payload={BASE_PAYLOAD} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(screen.getByText("Logo design")).toBeInTheDocument();
    expect(screen.getByText("Primary logo")).toBeInTheDocument();
    expect(screen.getByText("Brand guide")).toBeInTheDocument();
  });

  it("renders the grand total", () => {
    render(<QuotePreview payload={BASE_PAYLOAD} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(screen.getByText("$550.00")).toBeInTheDocument();
  });

  it("renders terms", () => {
    render(<QuotePreview payload={BASE_PAYLOAD} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(screen.getByText("Net 30")).toBeInTheDocument();
  });

  it("renders a back to editor link", () => {
    render(<QuotePreview payload={BASE_PAYLOAD} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    const link = screen.getByRole("link", { name: /back to editor/i });
    expect(link).toHaveAttribute("href", "/quotes/q-1?backTo=%2Fquotes");
  });

  it("renders the status badge", () => {
    render(<QuotePreview payload={BASE_PAYLOAD} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("omits empty content fields from line items", () => {
    render(<QuotePreview payload={BASE_PAYLOAD} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    // "Brand guide" has empty content, should show em-dash
    const cells = screen.getAllByText("\u2014");
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it("omits empty client contact fields", () => {
    const payload: QuotePreviewPayload = {
      ...BASE_PAYLOAD,
      clientContact: { name: "", email: "", phone: "" },
    };
    render(<QuotePreview payload={payload} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(screen.queryByText("Jane Doe")).not.toBeInTheDocument();
  });

  it("omits terms section when terms are empty", () => {
    const payload: QuotePreviewPayload = {
      ...BASE_PAYLOAD,
      terms: "",
    };
    render(<QuotePreview payload={payload} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(screen.queryByText("Terms")).not.toBeInTheDocument();
  });

  it("omits section content when empty", () => {
    const payload: QuotePreviewPayload = {
      ...BASE_PAYLOAD,
      sections: [
        {
          ...BASE_PAYLOAD.sections[0],
          content: "",
        },
      ],
    };
    render(<QuotePreview payload={payload} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(screen.queryByText("Custom design work")).not.toBeInTheDocument();
  });

  it("renders the estimate breakdown when snapshot data is present", () => {
    const payload: QuotePreviewPayload = {
      ...BASE_PAYLOAD,
      estimateBreakdown: {
        quoteId: "q-1",
        computedAt: "2026-03-21T12:00:00.000Z",
        sectionBreakdowns: [
          {
            sectionId: "qs-1",
            sectionTitle: "Design",
            source: {
              servicePackageId: "sp-1",
              servicePackageName: "Brand Launch",
              categoryLabel: "AI Print Campaigns",
              tierKey: "standard",
              tierTitle: "Standard",
              tierDescriptor: "Fast production",
              timeGuidance: { minValue: 1, maxValue: 3, unit: "day" },
              variableDefaults: {
                quantity: 1,
                durationValue: null,
                durationUnit: null,
                resolution: "print",
                revisions: 1,
                urgency: "standard",
              },
            },
            breakdown: {
              estimatedHours: { min: 8, max: 24 },
              roleBreakdown: [
                {
                  role: "Creative Director",
                  hours: 4.8,
                  hourlyRateCents: 15000,
                  costCents: 72000,
                },
              ],
              internalCostCents: 72000,
              marginPercent: 0.3,
              marginCents: 21600,
              finalPriceCents: 55000,
              deliverables: ["Print deliverable set"],
            },
          },
        ],
        grandTotal: {
          estimatedHours: { min: 8, max: 24 },
          roleBreakdown: [
            {
              role: "Creative Director",
              hours: 4.8,
              hourlyRateCents: 15000,
              costCents: 72000,
            },
          ],
          internalCostCents: 72000,
          marginPercent: 0.3,
          marginCents: 21600,
          finalPriceCents: 55000,
          deliverables: ["Print deliverable set"],
        },
      },
    };

    render(<QuotePreview payload={payload} editorHref="/quotes/q-1?backTo=%2Fquotes" />);

    expect(screen.getByText("Estimate breakdown")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /expand details/i }));
    expect(screen.getByText(/Brand Launch/)).toBeInTheDocument();
  });
});
