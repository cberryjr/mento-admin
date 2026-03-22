import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/features/invoices/server/queries/get-invoice", () => ({
  getInvoice: vi.fn(),
}));

vi.mock("@/features/studio-defaults/server/queries/get-studio-defaults", () => ({
  getStudioDefaults: vi.fn(),
}));

vi.mock("@/features/invoices/components/invoice-preview", () => ({
  InvoicePreview: ({
    editorHref,
    studioName,
  }: {
    editorHref: string;
    studioName?: string | null;
  }) => (
    <div>
      <a href={editorHref}>Back to invoice</a>
      <p>{studioName ?? "No studio name"}</p>
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const INVOICE = {
  id: "invoice-1",
  studioId: "default-studio",
  clientId: "client-1",
  sourceQuoteId: "quote-1",
  invoiceNumber: "INV-20260321-ABCD1234",
  title: "Spring launch invoice",
  status: "draft",
  issueDate: "2026-03-21T12:00:00.000Z",
  dueDate: "2026-04-05T12:00:00.000Z",
  paymentInstructions: "Pay by ACH.",
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
  sections: [],
  lineItems: [],
  sourceQuote: {
    id: "quote-1",
    quoteNumber: "Q-20260321-AAAA1111",
    title: "Spring launch proposal",
  },
};

describe("InvoicePreviewPage", () => {
  it("renders the preview with studio defaults and preserves backTo navigation", async () => {
    const { getInvoice } = await import("@/features/invoices/server/queries/get-invoice");
    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );

    vi.mocked(getInvoice).mockResolvedValue({
      ok: true,
      data: { invoice: INVOICE },
    } as never);
    vi.mocked(getStudioDefaults).mockResolvedValue({
      ok: true,
      data: {
        studioDefaults: {
          studioName: "Mento Studio",
        },
      },
    } as never);

    const { default: InvoicePreviewPage } = await import(
      "@/app/(workspace)/invoices/[invoiceId]/preview/page"
    );

    const page = InvoicePreviewPage({
      params: Promise.resolve({ invoiceId: "invoice-1" }),
      searchParams: Promise.resolve({ backTo: "/invoices?search=Sunrise" }),
    });

    render(await page);

    expect(screen.getByRole("link", { name: /back to invoice/i })).toHaveAttribute(
      "href",
      "/invoices/invoice-1?backTo=%2Finvoices%3Fsearch%3DSunrise",
    );
    expect(screen.getByText("Mento Studio")).toBeInTheDocument();
  });

  it("calls notFound for missing or unauthorized invoices", async () => {
    const { getInvoice } = await import("@/features/invoices/server/queries/get-invoice");
    const { notFound } = await import("next/navigation");

    vi.mocked(getInvoice).mockResolvedValue({
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Invoice not found.",
      },
    } as never);

    const { default: InvoicePreviewPage } = await import(
      "@/app/(workspace)/invoices/[invoiceId]/preview/page"
    );

    const page = InvoicePreviewPage({
      params: Promise.resolve({ invoiceId: "invoice-missing" }),
      searchParams: Promise.resolve({}),
    });

    await expect(page).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("renders recovery UI for operational load failures", async () => {
    const { getInvoice } = await import("@/features/invoices/server/queries/get-invoice");

    vi.mocked(getInvoice).mockResolvedValue({
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Could not load invoice.",
      },
    } as never);

    const { default: InvoicePreviewPage } = await import(
      "@/app/(workspace)/invoices/[invoiceId]/preview/page"
    );

    const page = InvoicePreviewPage({
      params: Promise.resolve({ invoiceId: "invoice-1" }),
      searchParams: Promise.resolve({}),
    });

    render(await page);

    expect(screen.getByText("Could not load invoice preview")).toBeInTheDocument();
    expect(screen.getByText("Could not load invoice.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to invoice/i })).toHaveAttribute(
      "href",
      "/invoices/invoice-1?backTo=%2Finvoices",
    );
  });

  it("preserves linked quote detail back navigation", async () => {
    const { getInvoice } = await import("@/features/invoices/server/queries/get-invoice");
    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );

    vi.mocked(getInvoice).mockResolvedValue({
      ok: true,
      data: { invoice: INVOICE },
    } as never);
    vi.mocked(getStudioDefaults).mockResolvedValue({
      ok: true,
      data: {
        studioDefaults: {
          studioName: "Mento Studio",
        },
      },
    } as never);

    const { default: InvoicePreviewPage } = await import(
      "@/app/(workspace)/invoices/[invoiceId]/preview/page"
    );

    const page = InvoicePreviewPage({
      params: Promise.resolve({ invoiceId: "invoice-1" }),
      searchParams: Promise.resolve({ backTo: "/quotes/quote-1?backTo=/quotes" }),
    });

    render(await page);

    expect(screen.getByRole("link", { name: /back to invoice/i })).toHaveAttribute(
      "href",
      "/invoices/invoice-1?backTo=%2Fquotes%2Fquote-1%3FbackTo%3D%252Fquotes",
    );
  });
});
