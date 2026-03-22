import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InvoicePreview } from "@/features/invoices/components/invoice-preview";
import type { InvoiceDetailRecord } from "@/features/invoices/types";

afterEach(() => {
  cleanup();
});

function buildInvoice(overrides?: Partial<InvoiceDetailRecord>): InvoiceDetailRecord {
  return {
    id: "invoice-1",
    studioId: "default-studio",
    clientId: "client-1",
    sourceQuoteId: "quote-1",
    invoiceNumber: "INV-20260321-ABCD1234",
    title: "Spring launch invoice",
    status: "draft",
    issueDate: "2026-03-21T12:00:00.000Z",
    dueDate: "2026-04-05T12:00:00.000Z",
    paymentInstructions: "Pay by ACH to account ending in 4242.",
    terms: "Net 15. Late fees apply after the due date.",
    createdAt: "2026-03-21T12:00:00.000Z",
    updatedAt: "2026-03-21T12:00:00.000Z",
    client: {
      id: "client-1",
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
        content: "Align on launch goals and review milestones.",
        position: 0,
        lineItems: [
          {
            id: "line-item-1",
            invoiceId: "invoice-1",
            invoiceSectionId: "section-1",
            studioId: "default-studio",
            name: "Workshop",
            content: "Kickoff session",
            quantity: 2,
            unitLabel: "session",
            unitPriceCents: 125000,
            lineTotalCents: 250000,
            position: 0,
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
        quantity: 2,
        unitLabel: "session",
        unitPriceCents: 125000,
        lineTotalCents: 250000,
        position: 0,
      },
    ],
    sourceQuote: {
      id: "quote-1",
      quoteNumber: "Q-20260321-AAAA1111",
      title: "Spring launch proposal",
    },
    ...overrides,
  };
}

describe("InvoicePreview", () => {
  it("renders invoice details, line items, totals, and delivery content", () => {
    render(
      <InvoicePreview
        invoice={buildInvoice()}
        studioName="Mento Studio"
        editorHref="/invoices/invoice-1"
      />,
    );

    expect(screen.getByRole("link", { name: /back to invoice/i })).toHaveAttribute(
      "href",
      "/invoices/invoice-1",
    );
    expect(screen.getByRole("heading", { name: "INVOICE" })).toBeInTheDocument();
    expect(screen.getByText("Mento Studio")).toBeInTheDocument();
    expect(screen.getByText("INV-20260321-ABCD1234")).toBeInTheDocument();
    expect(screen.getByText("Issue date: March 21, 2026")).toBeInTheDocument();
    expect(screen.getByText("Due date: April 5, 2026")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bill to" })).toBeInTheDocument();
    expect(screen.getByText("Sunrise Yoga Studio")).toBeInTheDocument();
    expect(screen.getByText("Avery Patel")).toBeInTheDocument();
    expect(screen.getByText("ops@sunriseyoga.example")).toBeInTheDocument();
    expect(screen.getByText("+1 555 0101")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Item" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Total" })).toBeInTheDocument();
    expect(screen.getByText("Discovery")).toBeInTheDocument();
    expect(screen.getByText("Kickoff session")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Total" })).toBeInTheDocument();
    expect(screen.getByText("$1,250.00")).toBeInTheDocument();
    expect(screen.getAllByText("$2,500.00")).toHaveLength(2);
    expect(screen.getByText("Pay by ACH to account ending in 4242.")).toBeInTheDocument();
    expect(screen.getByText("Net 15. Late fees apply after the due date.")).toBeInTheDocument();
    expect(screen.getByText(/status: draft/i)).toBeInTheDocument();
  });

  it("hides the terms section when terms are empty", () => {
    render(
      <InvoicePreview
        invoice={buildInvoice({ terms: "" })}
        studioName="Mento Studio"
        editorHref="/invoices/invoice-1"
      />,
    );

    expect(screen.queryByRole("heading", { name: /terms/i })).not.toBeInTheDocument();
  });

  it("renders 'Not set' placeholder when dates are null", () => {
    render(
      <InvoicePreview
        invoice={buildInvoice({ issueDate: null, dueDate: null })}
        studioName="Mento Studio"
        editorHref="/invoices/invoice-1"
      />,
    );

    expect(screen.getByText("Issue date: Not set")).toBeInTheDocument();
    expect(screen.getByText("Due date: Not set")).toBeInTheDocument();
  });

  it("renders 'Unknown client' fallback when client is null", () => {
    render(
      <InvoicePreview
        invoice={buildInvoice({ client: null })}
        studioName="Mento Studio"
        editorHref="/invoices/invoice-1"
      />,
    );

    expect(screen.getByText("Unknown client")).toBeInTheDocument();
    expect(screen.queryByText("Bill to")).toBeInTheDocument();
  });

  it("renders multiple sections with their line items and calculates correct total", () => {
    const multiSectionInvoice = buildInvoice({
      sections: [
        {
          id: "section-1",
          invoiceId: "invoice-1",
          studioId: "default-studio",
          title: "Discovery",
          content: "Audit work.",
          position: 0,
          lineItems: [
            {
              id: "line-item-1",
              invoiceId: "invoice-1",
              invoiceSectionId: "section-1",
              studioId: "default-studio",
              name: "Workshop",
              content: "Kickoff session",
              quantity: 2,
              unitLabel: "session",
              unitPriceCents: 125000,
              lineTotalCents: 250000,
              position: 0,
            },
          ],
        },
        {
          id: "section-2",
          invoiceId: "invoice-1",
          studioId: "default-studio",
          title: "Delivery",
          content: "Build work.",
          position: 1,
          lineItems: [
            {
              id: "line-item-2",
              invoiceId: "invoice-1",
              invoiceSectionId: "section-2",
              studioId: "default-studio",
              name: "Development",
              content: "Sprint work",
              quantity: 1,
              unitLabel: "sprint",
              unitPriceCents: 500000,
              lineTotalCents: 500000,
              position: 0,
            },
          ],
        },
      ],
      lineItems: [],
    });

    render(
      <InvoicePreview
        invoice={multiSectionInvoice}
        studioName="Mento Studio"
        editorHref="/invoices/invoice-1"
      />,
    );

    expect(screen.getByText("Discovery")).toBeInTheDocument();
    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByText("Workshop")).toBeInTheDocument();
    expect(screen.getByText("Development")).toBeInTheDocument();
    expect(screen.getByText("$7,500.00")).toBeInTheDocument();
  });

  it("renders empty state when sections have no line items", () => {
    const emptyInvoice = buildInvoice({
      sections: [
        {
          id: "section-1",
          invoiceId: "invoice-1",
          studioId: "default-studio",
          title: "Empty section",
          content: "",
          position: 0,
          lineItems: [],
        },
      ],
      lineItems: [],
    });

    render(
      <InvoicePreview
        invoice={emptyInvoice}
        studioName="Mento Studio"
        editorHref="/invoices/invoice-1"
      />,
    );

    expect(screen.getByText("Empty section")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });

  it("renders without studio name when studioName is null", () => {
    render(
      <InvoicePreview
        invoice={buildInvoice()}
        studioName={null}
        editorHref="/invoices/invoice-1"
      />,
    );

    expect(screen.queryByText("Mento Studio")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "INVOICE" })).toBeInTheDocument();
  });
});
