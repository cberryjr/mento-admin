import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/features/invoices/server/queries/get-invoice", () => ({
  getInvoice: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function buildInvoice(status: "draft" | "sent" | "paid" = "draft") {
  return {
    id: "invoice-1",
    studioId: "default-studio",
    clientId: "client-1",
    sourceQuoteId: "quote-1",
    invoiceNumber: "INV-20260321-ABCD1234",
    title: "Spring launch invoice",
    status,
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
}

describe("InvoiceDetailPage", () => {
  it("shows preview and export actions with preserved back navigation for draft invoices", async () => {
    const { getInvoice } = await import("@/features/invoices/server/queries/get-invoice");

    vi.mocked(getInvoice).mockResolvedValue({
      ok: true,
      data: { invoice: buildInvoice("draft") },
    } as never);

    const { default: InvoiceDetailPage } = await import(
      "@/app/(workspace)/invoices/[invoiceId]/page"
    );

    const page = InvoiceDetailPage({
      params: Promise.resolve({ invoiceId: "invoice-1" }),
      searchParams: Promise.resolve({ backTo: "/invoices?search=Sunrise" }),
    });

    render(await page);

    expect(screen.getByRole("link", { name: "Preview" })).toHaveAttribute(
      "href",
      "/invoices/invoice-1/preview?backTo=%2Finvoices%3Fsearch%3DSunrise",
    );
    expect(screen.getByRole("link", { name: "Export PDF" })).toHaveAttribute(
      "href",
      "/api/invoices/invoice-1/pdf",
    );
    expect(screen.getByRole("link", { name: "Correct Data" })).toHaveAttribute(
      "href",
      "/records/correct?type=invoice&id=invoice-1&backTo=%2Finvoices%2Finvoice-1%3FbackTo%3D%252Finvoices%253Fsearch%253DSunrise",
    );
    expect(screen.getByRole("link", { name: "Preview" }).className).toContain(
      "bg-zinc-900",
    );
    expect(screen.getByRole("link", { name: "Export PDF" }).className).toContain(
      "border-zinc-300",
    );
  });

  it.each(["sent", "paid"] as const)(
    "shows preview and export actions for %s invoices",
    async (status) => {
      const { getInvoice } = await import("@/features/invoices/server/queries/get-invoice");

      vi.mocked(getInvoice).mockResolvedValue({
        ok: true,
        data: { invoice: buildInvoice(status) },
      } as never);

      const { default: InvoiceDetailPage } = await import(
        "@/app/(workspace)/invoices/[invoiceId]/page"
      );

      const page = InvoiceDetailPage({
        params: Promise.resolve({ invoiceId: "invoice-1" }),
        searchParams: Promise.resolve({}),
      });

      render(await page);

      expect(screen.getByRole("link", { name: "Preview" })).toHaveAttribute(
        "href",
        "/invoices/invoice-1/preview?backTo=%2Finvoices",
      );
      expect(screen.getByRole("link", { name: "Export PDF" })).toHaveAttribute(
        "href",
        "/api/invoices/invoice-1/pdf",
      );
      expect(screen.getByRole("button", { name: "Reopen for Editing" })).toBeInTheDocument();
    },
  );

  it("preserves linked quote back navigation for reopened invoices", async () => {
    const { getInvoice } = await import("@/features/invoices/server/queries/get-invoice");

    vi.mocked(getInvoice).mockResolvedValue({
      ok: true,
      data: { invoice: buildInvoice("sent") },
    } as never);

    const { default: InvoiceDetailPage } = await import(
      "@/app/(workspace)/invoices/[invoiceId]/page"
    );

    const page = InvoiceDetailPage({
      params: Promise.resolve({ invoiceId: "invoice-1" }),
      searchParams: Promise.resolve({ backTo: "/quotes/quote-1?backTo=/quotes" }),
    });

    render(await page);

    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
      "href",
      "/quotes/quote-1?backTo=%2Fquotes",
    );
    expect(screen.getByRole("link", { name: "Preview" })).toHaveAttribute(
      "href",
      "/invoices/invoice-1/preview?backTo=%2Fquotes%2Fquote-1%3FbackTo%3D%252Fquotes",
    );
  });
});
