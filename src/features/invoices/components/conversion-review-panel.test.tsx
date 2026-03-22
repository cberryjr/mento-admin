import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ConversionReviewPanel } from "@/features/invoices/components/conversion-review-panel";
import type { InvoiceDetailRecord } from "@/features/invoices/types";

afterEach(() => {
  cleanup();
});

function buildInvoice(): InvoiceDetailRecord {
  return {
    id: "invoice-1",
    studioId: "default-studio",
    clientId: "client-sunrise-yoga",
    sourceQuoteId: "quote-1",
    invoiceNumber: "INV-20260321-ABCD1234",
    title: "Spring launch invoice",
    status: "draft",
    issueDate: null,
    dueDate: null,
    paymentInstructions: "ACH preferred",
    terms: "Net 15",
    createdAt: "2026-03-21T12:00:00.000Z",
    updatedAt: "2026-03-21T12:00:00.000Z",
    client: {
      id: "client-sunrise-yoga",
      name: "Sunrise Yoga Studio",
      contactName: "Avery Patel",
      contactEmail: "ops@sunriseyoga.example",
      contactPhone: "+1 555 0101",
    },
    sections: [
      {
        id: "section-1",
        invoiceId: "invoice-1",
        studioId: "default-studio",
        title: "Discovery",
        content: "Align on launch goals.",
        position: 1,
        lineItems: [
          {
            id: "line-item-1",
            invoiceId: "invoice-1",
            invoiceSectionId: "section-1",
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
    ],
    lineItems: [
      {
        id: "line-item-1",
        invoiceId: "invoice-1",
        invoiceSectionId: "section-1",
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
    sourceQuote: {
      id: "quote-1",
      quoteNumber: "Q-20260321-AAAA1111",
      title: "Spring launch proposal",
    },
  };
}

describe("ConversionReviewPanel", () => {
  it("shows client details and preserved quote sections", () => {
    render(<ConversionReviewPanel invoice={buildInvoice()} />);

    expect(screen.getByText("Sunrise Yoga Studio")).toBeInTheDocument();
    expect(screen.getByText("Avery Patel")).toBeInTheDocument();
    expect(screen.getByText("Discovery")).toBeInTheDocument();
    expect(screen.getByText("Workshop")).toBeInTheDocument();
  });

  it("renders invoice-specific fields as read-only", () => {
    render(<ConversionReviewPanel invoice={buildInvoice()} />);

    const titleInput = screen.getByLabelText("Invoice title");
    expect(titleInput).toBeDisabled();
    expect(titleInput).toHaveValue("Spring launch invoice");
    expect(screen.getByLabelText("Payment instructions")).toHaveValue(
      "ACH preferred",
    );
    expect(screen.getByLabelText("Payment instructions")).toBeDisabled();
  });
});
