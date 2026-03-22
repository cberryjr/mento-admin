import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

import { InvoiceForm } from "@/features/invoices/components/invoice-form";
import type { InvoiceDetailRecord } from "@/features/invoices/types";
import type { ActionResult } from "@/lib/validation/action-result";

afterEach(() => {
  cleanup();
});

function buildInvoice(overrides?: Partial<InvoiceDetailRecord>): InvoiceDetailRecord {
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
        position: 0,
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
      title: "Spring launch proposal",
    },
    ...overrides,
  };
}

function buildSuccessResult(invoice: InvoiceDetailRecord): ActionResult<{ invoice: InvoiceDetailRecord }> {
  return { ok: true, data: { invoice } };
}

describe("InvoiceForm", () => {
  it("renders editable fields for a draft invoice", () => {
    const submitAction = vi.fn();
    render(<InvoiceForm invoice={buildInvoice()} submitAction={submitAction} />);

    expect(screen.getByLabelText("Invoice title")).toBeInTheDocument();
    expect(screen.getByLabelText("Issue date")).toBeInTheDocument();
    expect(screen.getByLabelText("Due date")).toBeInTheDocument();
    expect(screen.getByLabelText("Payment instructions")).toBeInTheDocument();
    expect(screen.getByLabelText("Terms")).toBeInTheDocument();
    expect(screen.getByText("Save invoice")).toBeInTheDocument();
  });

  it("allows editing invoice title", () => {
    const submitAction = vi.fn();
    render(<InvoiceForm invoice={buildInvoice()} submitAction={submitAction} />);

    const titleInput = screen.getByLabelText("Invoice title");
    fireEvent.change(titleInput, { target: { value: "Updated title" } });

    expect(titleInput).toHaveValue("Updated title");
  });

  it("recalculates totals client-side on quantity change", () => {
    const submitAction = vi.fn();
    render(<InvoiceForm invoice={buildInvoice()} submitAction={submitAction} />);

    const totalParagraph = screen.getByText(/Total \$1250\.00/);
    expect(totalParagraph).toBeInTheDocument();

    const qtyInput = screen.getByLabelText("Quantity");
    fireEvent.change(qtyInput, { target: { value: "2" } });

    expect(totalParagraph.textContent).toContain("$2500.00");
  });

  it("submits the form with updated data", async () => {
    const invoice = buildInvoice();
    const submitAction = vi.fn().mockResolvedValue(buildSuccessResult(invoice));

    render(<InvoiceForm invoice={invoice} submitAction={submitAction} />);

    const titleInput = screen.getByLabelText("Invoice title");
    fireEvent.change(titleInput, { target: { value: "New Title" } });

    fireEvent.click(screen.getByText("Save invoice"));

    await waitFor(() => {
      expect(submitAction).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceId: "invoice-1",
          title: "New Title",
        }),
      );
    });
  });

  it("shows success feedback after successful save", async () => {
    const invoice = buildInvoice();
    const submitAction = vi.fn().mockResolvedValue(buildSuccessResult(invoice));

    render(<InvoiceForm invoice={invoice} submitAction={submitAction} />);

    fireEvent.click(screen.getByText("Save invoice"));

    await waitFor(() => {
      expect(screen.getByText("Invoice saved")).toBeInTheDocument();
    });
  });

  it("shows error feedback after failed save", async () => {
    const submitAction = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
        fieldErrors: { title: ["Title is required."] },
      },
    });

    render(<InvoiceForm invoice={buildInvoice()} submitAction={submitAction} />);

    fireEvent.click(screen.getByText("Save invoice"));

    await waitFor(() => {
      expect(screen.getByText("Could not save invoice")).toBeInTheDocument();
    });
  });

  it("shows nested line item validation errors inline", async () => {
    const submitAction = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
        fieldErrors: {
          "sections.0.lineItems.0.name": ["Line item name is required."],
        },
      },
    });

    render(<InvoiceForm invoice={buildInvoice()} submitAction={submitAction} />);

    fireEvent.click(screen.getByText("Save invoice"));

    await waitFor(() => {
      expect(screen.getByText("Line item name is required.")).toBeInTheDocument();
    });
  });

  it("disables form controls for non-draft invoices", () => {
    const submitAction = vi.fn();
    render(
      <InvoiceForm
        invoice={buildInvoice({ status: "sent" })}
        submitAction={submitAction}
      />,
    );

    expect(screen.getByLabelText("Invoice title")).toBeDisabled();
    expect(screen.queryByText("Save invoice")).not.toBeInTheDocument();
    expect(
      screen.getByText("Invoice is not in draft status"),
    ).toBeInTheDocument();
  });

  it("allows adding a new section", () => {
    const submitAction = vi.fn();
    render(<InvoiceForm invoice={buildInvoice()} submitAction={submitAction} />);

    const sectionTitleLabelsBefore = screen.getAllByText("Section title");
    expect(sectionTitleLabelsBefore).toHaveLength(1);

    fireEvent.click(screen.getByText("Add section"));

    const sectionTitleLabelsAfter = screen.getAllByText("Section title");
    expect(sectionTitleLabelsAfter).toHaveLength(2);
  });

  it("allows adding a new line item to a section", () => {
    const submitAction = vi.fn();
    render(<InvoiceForm invoice={buildInvoice()} submitAction={submitAction} />);

    fireEvent.click(screen.getByText("Add line item"));

    const lineItemInputs = screen.getAllByLabelText("Line item name");
    expect(lineItemInputs).toHaveLength(2);
  });

  it("allows removing a section", () => {
    const submitAction = vi.fn();
    render(<InvoiceForm invoice={buildInvoice()} submitAction={submitAction} />);

    const sectionTitleLabelsBefore = screen.getAllByText("Section title");
    expect(sectionTitleLabelsBefore).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /Remove section Discovery/ }));

    const sectionTitleLabelsAfter = screen.queryAllByText("Section title");
    expect(sectionTitleLabelsAfter).toHaveLength(0);
  });
});
