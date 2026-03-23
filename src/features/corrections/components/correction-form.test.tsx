import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

import { CorrectionForm } from "@/features/corrections/components/correction-form";
import type { InvoiceDetailRecord } from "@/features/invoices/types";
import type { QuoteDetailRecord } from "@/features/quotes/types";
import type { ActionResult } from "@/lib/validation/action-result";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});

function buildQuote(overrides: Partial<QuoteDetailRecord> = {}): QuoteDetailRecord {
  return {
    id: "quote-1",
    studioId: "default-studio",
    clientId: "client-1",
    quoteNumber: "Q-20260321-AAAA1111",
    title: "Spring launch quote",
    status: "draft",
    terms: "Net 15",
    selectedServicePackageIds: ["sp-1"],
    generatedAt: "2026-03-21T12:00:00.000Z",
    createdAt: "2026-03-21T12:00:00.000Z",
    updatedAt: "2026-03-21T12:00:00.000Z",
    sections: [
      {
        id: "quote-section-1",
        quoteId: "quote-1",
        studioId: "default-studio",
        sourceServicePackageId: "sp-1",
        title: "Discovery",
        content: "Align on launch goals.",
        position: 1,
        lineItems: [
          {
            id: "quote-line-item-1",
            quoteId: "quote-1",
            quoteSectionId: "quote-section-1",
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
    ...overrides,
  };
}

function buildInvoice(overrides: Partial<InvoiceDetailRecord> = {}): InvoiceDetailRecord {
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
    paymentInstructions: "ACH preferred",
    terms: "Net 15",
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
        id: "invoice-section-1",
        invoiceId: "invoice-1",
        studioId: "default-studio",
        title: "Discovery",
        content: "Align on launch goals.",
        position: 0,
        lineItems: [
          {
            id: "invoice-line-item-1",
            invoiceId: "invoice-1",
            invoiceSectionId: "invoice-section-1",
            studioId: "default-studio",
            name: "Workshop",
            content: "Kickoff session",
            quantity: 1,
            unitLabel: "session",
            unitPriceCents: 125000,
            lineTotalCents: 125000,
            position: 0,
          },
        ],
      },
    ],
    lineItems: [
      {
        id: "invoice-line-item-1",
        invoiceId: "invoice-1",
        invoiceSectionId: "invoice-section-1",
        studioId: "default-studio",
        name: "Workshop",
        content: "Kickoff session",
        quantity: 1,
        unitLabel: "session",
        unitPriceCents: 125000,
        lineTotalCents: 125000,
        position: 0,
      },
    ],
    sourceQuote: {
      id: "quote-1",
      quoteNumber: "Q-20260321-AAAA1111",
      title: "Spring launch quote",
    },
    ...overrides,
  };
}

const clientOptions = [
  { id: "client-1", name: "Sunrise Yoga Studio" },
  { id: "client-2", name: "Moonrise Pilates" },
];

function quoteSuccessResult(
  quote: QuoteDetailRecord,
): ActionResult<{ quote: QuoteDetailRecord }> {
  return { ok: true, data: { quote } };
}

function invoiceSuccessResult(
  invoice: InvoiceDetailRecord,
): ActionResult<{ invoice: InvoiceDetailRecord }> {
  return { ok: true, data: { invoice } };
}

describe("CorrectionForm", () => {
  it("renders editable fields for all correctable data", () => {
    const quoteSubmitAction = vi.fn();
    const invoiceSubmitAction = vi.fn();

    const { rerender } = render(
      <CorrectionForm
        mode="quote"
        record={buildQuote()}
        clientOptions={clientOptions}
        backHref="/quotes/quote-1?backTo=%2Fquotes"
        submitAction={quoteSubmitAction}
      />,
    );

    expect(screen.getByLabelText("Client")).toBeInTheDocument();
    expect(screen.getByLabelText("Quote status")).toBeInTheDocument();
    expect(screen.getByLabelText("Terms")).toBeInTheDocument();
    expect(screen.getByLabelText("Section title")).toBeInTheDocument();
    expect(screen.getByLabelText("Line item name")).toBeInTheDocument();

    rerender(
      <CorrectionForm
        mode="invoice"
        record={buildInvoice()}
        clientOptions={clientOptions}
        backHref="/invoices/invoice-1?backTo=%2Finvoices"
        submitAction={invoiceSubmitAction}
      />,
    );

    expect(screen.getByLabelText("Issue date")).toBeInTheDocument();
    expect(screen.getByLabelText("Due date")).toBeInTheDocument();
    expect(screen.getByLabelText("Payment instructions")).toBeInTheDocument();
  });

  it("updates field values on user input", () => {
    const submitAction = vi.fn();
    render(
      <CorrectionForm
        mode="quote"
        record={buildQuote()}
        clientOptions={clientOptions}
        backHref="/quotes/quote-1?backTo=%2Fquotes"
        submitAction={submitAction}
      />,
    );

    const termsInput = screen.getByLabelText("Terms");
    const sectionTitleInput = screen.getByLabelText("Section title");

    fireEvent.change(termsInput, { target: { value: "Net 30 with deposit" } });
    fireEvent.change(sectionTitleInput, {
      target: { value: "Discovery and alignment" },
    });

    expect(termsInput).toHaveValue("Net 30 with deposit");
    expect(sectionTitleInput).toHaveValue("Discovery and alignment");
  });

  it("shows validation errors for invalid input", async () => {
    const submitAction = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
        fieldErrors: {
          "corrections.sections.0.lineItems.0.name": ["Line item name is required."],
        },
      },
    });

    render(
      <CorrectionForm
        mode="quote"
        record={buildQuote()}
        clientOptions={clientOptions}
        backHref="/quotes/quote-1?backTo=%2Fquotes"
        submitAction={submitAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save corrections" }));

    await waitFor(() => {
      expect(screen.getByText("Line item name is required.")).toBeInTheDocument();
    });
  });

  it("recalculates totals on pricing changes", () => {
    const submitAction = vi.fn();
    render(
      <CorrectionForm
        mode="invoice"
        record={buildInvoice()}
        clientOptions={clientOptions}
        backHref="/invoices/invoice-1?backTo=%2Finvoices"
        submitAction={submitAction}
      />,
    );

    expect(screen.getByText(/Total \$1,250\.00/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Quantity"), {
      target: { value: "2" },
    });

    expect(screen.getByText(/Total \$2,500\.00/)).toBeInTheDocument();
  });

  it("submits correction with valid data", async () => {
    const updatedInvoice = buildInvoice({ terms: "Net 30" });
    const submitAction = vi
      .fn()
      .mockResolvedValue(invoiceSuccessResult(updatedInvoice));

    render(
      <CorrectionForm
        mode="invoice"
        record={buildInvoice()}
        clientOptions={clientOptions}
        backHref="/invoices/invoice-1?backTo=%2Finvoices"
        submitAction={submitAction}
      />,
    );

    fireEvent.change(screen.getByLabelText("Terms"), {
      target: { value: "Net 30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save corrections" }));

    await waitFor(() => {
      expect(submitAction).toHaveBeenCalledWith(
        expect.objectContaining({
          corrections: expect.objectContaining({
            terms: "Net 30",
          }),
          invoiceId: "invoice-1",
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByText("Corrections saved")).toBeInTheDocument();
    });
  });

  it("supports keyboard submission from a text field", async () => {
    const updatedQuote = buildQuote({ terms: "Net 30" });
    const submitAction = vi.fn().mockResolvedValue(quoteSuccessResult(updatedQuote));

    render(
      <CorrectionForm
        mode="quote"
        record={buildQuote()}
        clientOptions={clientOptions}
        backHref="/quotes/quote-1?backTo=%2Fquotes"
        submitAction={submitAction}
      />,
    );

    const sectionTitleInput = screen.getByLabelText("Section title");
    sectionTitleInput.focus();

    fireEvent.keyDown(sectionTitleInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(submitAction).toHaveBeenCalledWith(
        expect.objectContaining({ quoteId: "quote-1" }),
      );
    });
  });
});
