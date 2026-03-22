import { afterEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/features/invoices/server/invoices-repository", () => ({
  getInvoiceById: vi.fn(),
}));

vi.mock("@/server/auth/permissions", () => ({
  ensureStudioAccess: vi.fn(),
}));

vi.mock("@/features/studio-defaults/server/studio-defaults-repository", () => ({
  loadStudioDefaults: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

const SESSION = {
  user: {
    id: "user-1",
    email: "owner@example.com",
    studioId: "default-studio",
    role: "owner",
  },
  expires: "2026-03-22T00:00:00.000Z",
} as const;

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
} as const;

describe("GET /api/invoices/[invoiceId]/pdf", () => {
  it("returns a PDF export with invoice content and attachment headers", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { getInvoiceById } = await import("@/features/invoices/server/invoices-repository");
    const { ensureStudioAccess } = await import("@/server/auth/permissions");
    const { loadStudioDefaults } = await import(
      "@/features/studio-defaults/server/studio-defaults-repository"
    );

    vi.mocked(requireSession).mockResolvedValue(SESSION as never);
    vi.mocked(getInvoiceById).mockResolvedValue(INVOICE as never);
    vi.mocked(loadStudioDefaults).mockResolvedValue({
      studioId: "default-studio",
      studioName: "Mento Studio",
    } as never);

    const { GET } = await import("@/app/api/invoices/[invoiceId]/pdf/route");

    const response = await GET(
      new Request("https://mento-admin.local/api/invoices/invoice-1/pdf"),
      { params: Promise.resolve({ invoiceId: "invoice-1" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="INV-20260321-ABCD1234.pdf"',
    );
    expect(requireSession).toHaveBeenCalledTimes(1);
    expect(ensureStudioAccess).toHaveBeenCalledWith(SESSION, "default-studio");

    const pdfText = Buffer.from(await response.arrayBuffer()).toString("utf8");
    expect(pdfText.startsWith("%PDF-")).toBe(true);
    expect(pdfText).toContain("INV-20260321-ABCD1234");
    expect(pdfText).toContain("Mento Studio");
    expect(pdfText).toContain("Sunrise Yoga Studio");
    expect(pdfText).toContain("Kickoff session");
    expect(pdfText).toContain("Pay by ACH to account ending in 4242.");
  });

  it("returns not found when the invoice does not exist", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { getInvoiceById } = await import("@/features/invoices/server/invoices-repository");

    vi.mocked(requireSession).mockResolvedValue(SESSION as never);
    vi.mocked(getInvoiceById).mockResolvedValue(null);

    const { GET } = await import("@/app/api/invoices/[invoiceId]/pdf/route");

    const response = await GET(
      new Request("https://mento-admin.local/api/invoices/invoice-missing/pdf"),
      { params: Promise.resolve({ invoiceId: "invoice-missing" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: ERROR_CODES.UNKNOWN,
        message: "Invoice not found.",
      },
    });
  });

  it("returns a forbidden error when the user cannot access the invoice studio", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { getInvoiceById } = await import("@/features/invoices/server/invoices-repository");
    const { ensureStudioAccess } = await import("@/server/auth/permissions");

    vi.mocked(requireSession).mockResolvedValue(SESSION as never);
    vi.mocked(getInvoiceById).mockResolvedValue(INVOICE as never);
    vi.mocked(ensureStudioAccess).mockImplementation(() => {
      throw new AppError(ERROR_CODES.FORBIDDEN, "You are not allowed to access this workspace.");
    });

    const { GET } = await import("@/app/api/invoices/[invoiceId]/pdf/route");

    const response = await GET(
      new Request("https://mento-admin.local/api/invoices/invoice-1/pdf"),
      { params: Promise.resolve({ invoiceId: "invoice-1" }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: ERROR_CODES.FORBIDDEN,
        message: "You are not allowed to access this workspace.",
      },
    });
  });
});
