import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession } from "@/features/auth/session";
import { __resetInvoicesStore } from "@/features/invoices/server/store/invoices-store";
import { __resetQuotesStore } from "@/features/quotes/server/store/quotes-store";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

function setSession(studioId = "default-studio"): AuthSession {
  return {
    user: {
      id: "owner-1",
      email: "owner@example.com",
      role: "owner",
      studioId,
    },
    expires: new Date(Date.now() + 360000).toISOString(),
  };
}

async function seedInvoice(status: "draft" | "sent" | "paid" = "sent") {
  const quotesRepo = await import("@/features/quotes/server/quotes-repository");
  const invoicesRepo = await import("@/features/invoices/server/invoices-repository");

  const quote = await quotesRepo.createQuoteRecord("default-studio", {
    clientId: "client-sunrise-yoga",
    title: "Test Quote",
    selectedServicePackageIds: ["sp-1"],
    terms: "Net 30",
  });

  await quotesRepo.saveQuoteSections(quote.id, "default-studio", [
    {
      id: "section-1",
      quoteId: quote.id,
      studioId: "default-studio",
      sourceServicePackageId: "sp-1",
      title: "Scope",
      content: "",
      position: 1,
      lineItems: [
        {
          id: "li-1",
          quoteId: quote.id,
          quoteSectionId: "section-1",
          studioId: "default-studio",
          name: "Design",
          content: "Web design",
          quantity: 1,
          unitLabel: "project",
          unitPriceCents: 500000,
          lineTotalCents: 500000,
          position: 1,
        },
      ],
    },
  ]);

  await quotesRepo.updateQuoteStatus(quote.id, "accepted");
  const invoice = await invoicesRepo.createInvoiceFromQuote("default-studio", quote.id);

  if (status !== "draft") {
    await invoicesRepo.updateInvoiceStatus(invoice.id, status);
  }

  return invoice;
}

describe("reopenInvoiceAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetInvoicesStore();
    __resetQuotesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  it("reopens sent invoice to draft successfully", async () => {
    const invoice = await seedInvoice("sent");
    const { reopenInvoiceAction } = await import(
      "@/features/invoices/server/actions/reopen-invoice"
    );

    const result = await reopenInvoiceAction({ invoiceId: invoice.id });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.invoice.status).toBe("draft");
    }
  });

  it("reopens paid invoice to draft successfully", async () => {
    const invoice = await seedInvoice("paid");
    const { reopenInvoiceAction } = await import(
      "@/features/invoices/server/actions/reopen-invoice"
    );

    const result = await reopenInvoiceAction({ invoiceId: invoice.id });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.invoice.status).toBe("draft");
    }
  });

  it("returns success for already-draft invoice (idempotent)", async () => {
    const invoice = await seedInvoice("draft");
    const { reopenInvoiceAction } = await import(
      "@/features/invoices/server/actions/reopen-invoice"
    );

    const result = await reopenInvoiceAction({ invoiceId: invoice.id });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.invoice.status).toBe("draft");
    }
  });

  it("returns error for non-existent invoice", async () => {
    const { reopenInvoiceAction } = await import(
      "@/features/invoices/server/actions/reopen-invoice"
    );

    const result = await reopenInvoiceAction({ invoiceId: "nonexistent" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Invoice not found.");
    }
  });

  it("returns error when studio access is denied", async () => {
    const invoice = await seedInvoice("sent");
    const { requireSession } = await import("@/features/auth/require-session");

    vi.mocked(requireSession).mockResolvedValue(setSession("other-studio"));

    const { reopenInvoiceAction } = await import(
      "@/features/invoices/server/actions/reopen-invoice"
    );

    const result = await reopenInvoiceAction({ invoiceId: invoice.id });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Invoice not found.");
    }
  });
});
