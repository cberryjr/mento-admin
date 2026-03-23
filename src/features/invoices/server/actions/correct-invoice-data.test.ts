import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession } from "@/features/auth/session";
import { __resetClientsStore } from "@/features/clients/server/clients-repository";
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

describe("correctInvoiceData", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetClientsStore();
    __resetInvoicesStore();
    __resetQuotesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  async function seedInvoice() {
    const clientsRepo = await import("@/features/clients/server/clients-repository");
    const quotesRepo = await import("@/features/quotes/server/quotes-repository");
    const invoicesRepo = await import("@/features/invoices/server/invoices-repository");

    const primaryClient = await clientsRepo.createClientRecord("default-studio", {
      name: "Sunrise Yoga Studio",
      contactName: "Avery Patel",
      contactEmail: "ops@sunriseyoga.example",
      contactPhone: "+1 555 0101",
    });
    const secondaryClient = await clientsRepo.createClientRecord("default-studio", {
      name: "Moonrise Pilates",
      contactName: "Jordan Lee",
      contactEmail: "hello@moonrise.example",
      contactPhone: "+1 555 0102",
    });
    const otherStudioClient = await clientsRepo.createClientRecord("other-studio", {
      name: "Cross Studio",
      contactName: "Morgan Doe",
      contactEmail: "cross@example.com",
      contactPhone: "+1 555 0103",
    });

    const quote = await quotesRepo.createQuoteRecord("default-studio", {
      clientId: primaryClient.id,
      title: "Spring launch quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "Net 15",
    });

    await quotesRepo.saveQuoteSections(quote.id, "default-studio", [
      {
        id: "section-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "sp-1",
        title: "Discovery",
        content: "Original scope",
        position: 1,
        lineItems: [
          {
            id: "line-item-1",
            quoteId: quote.id,
            quoteSectionId: "section-1",
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
    ]);

    await quotesRepo.updateQuoteStatus(quote.id, "accepted");
    const invoice = await invoicesRepo.createInvoiceFromQuote("default-studio", quote.id);

    return { invoice, primaryClient, secondaryClient, otherStudioClient };
  }

  it("corrects client data successfully", async () => {
    const { invoice, secondaryClient } = await seedInvoice();
    const { correctInvoiceData } = await import(
      "@/features/invoices/server/actions/correct-invoice-data"
    );

    const result = await correctInvoiceData({
      invoiceId: invoice.id,
      corrections: {
        clientId: secondaryClient.id,
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.invoice.clientId).toBe(secondaryClient.id);
      expect(result.data.invoice.client?.name).toBe("Moonrise Pilates");
    }
  });

  it("corrects section content successfully", async () => {
    const { invoice } = await seedInvoice();
    const { correctInvoiceData } = await import(
      "@/features/invoices/server/actions/correct-invoice-data"
    );

    const result = await correctInvoiceData({
      invoiceId: invoice.id,
      corrections: {
        sections: [
          {
            id: invoice.sections[0].id,
            title: "Discovery and alignment",
            description: "Updated scope details",
            lineItems: [
              {
                id: invoice.sections[0].lineItems[0].id,
                description: "Updated kickoff session",
              },
            ],
          },
        ],
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.invoice.sections[0].title).toBe("Discovery and alignment");
      expect(result.data.invoice.sections[0].content).toBe("Updated scope details");
      expect(result.data.invoice.sections[0].lineItems[0].content).toBe(
        "Updated kickoff session",
      );
    }
  });

  it("corrects line items and recalculates totals", async () => {
    const { invoice } = await seedInvoice();
    const { correctInvoiceData } = await import(
      "@/features/invoices/server/actions/correct-invoice-data"
    );

    const result = await correctInvoiceData({
      invoiceId: invoice.id,
      corrections: {
        sections: [
          {
            id: invoice.sections[0].id,
            lineItems: [
              {
                id: invoice.sections[0].lineItems[0].id,
                quantity: 2,
                unitPriceCents: 150000,
              },
            ],
          },
        ],
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.invoice.sections[0].lineItems[0].quantity).toBe(2);
      expect(result.data.invoice.sections[0].lineItems[0].unitPriceCents).toBe(150000);
      expect(result.data.invoice.sections[0].lineItems[0].lineTotalCents).toBe(300000);
    }
  });

  it("corrects pricing values and recalculates totals", async () => {
    const { invoice } = await seedInvoice();
    const { correctInvoiceData } = await import(
      "@/features/invoices/server/actions/correct-invoice-data"
    );

    const result = await correctInvoiceData({
      invoiceId: invoice.id,
      corrections: {
        sections: [
          {
            id: invoice.sections[0].id,
            lineItems: [
              {
                id: invoice.sections[0].lineItems[0].id,
                unitPriceCents: 99000,
              },
            ],
          },
        ],
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.invoice.sections[0].lineItems[0].lineTotalCents).toBe(99000);
    }
  });

  it("corrects dates, terms, payment instructions, and allowed status changes", async () => {
    const { invoice } = await seedInvoice();
    const { correctInvoiceData } = await import(
      "@/features/invoices/server/actions/correct-invoice-data"
    );

    const result = await correctInvoiceData({
      invoiceId: invoice.id,
      corrections: {
        dates: {
          dueDate: "2026-04-15",
          issueDate: "2026-04-01",
        },
        paymentInstructions: "Pay by ACH",
        status: "sent",
        terms: "Net 30",
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.invoice.issueDate).toContain("2026-04-01");
      expect(result.data.invoice.dueDate).toContain("2026-04-15");
      expect(result.data.invoice.paymentInstructions).toBe("Pay by ACH");
      expect(result.data.invoice.terms).toBe("Net 30");
      expect(result.data.invoice.status).toBe("sent");
    }
  });

  it("returns validation error for invalid input", async () => {
    const { invoice, otherStudioClient } = await seedInvoice();
    const { correctInvoiceData } = await import(
      "@/features/invoices/server/actions/correct-invoice-data"
    );

    const result = await correctInvoiceData({
      invoiceId: invoice.id,
      corrections: {
        clientId: otherStudioClient.id,
        dates: {
          issueDate: "not-a-date",
        },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.issueDate ?? result.error.fieldErrors?.["corrections.dates.issueDate"]).toBeDefined();
    }
  });

  it("returns unauthorized for wrong studio", async () => {
    const { invoice } = await seedInvoice();
    const { requireSession } = await import("@/features/auth/require-session");
    const { correctInvoiceData } = await import(
      "@/features/invoices/server/actions/correct-invoice-data"
    );

    vi.mocked(requireSession).mockResolvedValue(setSession("other-studio"));

    const result = await correctInvoiceData({
      invoiceId: invoice.id,
      corrections: {
        terms: "Updated terms",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Invoice not found.");
    }
  });

  it("emits the invoice.corrected workflow event", async () => {
    const { invoice } = await seedInvoice();
    const events = await import("@/features/corrections/server/correction-events");
    const emitEvent = vi.spyOn(events, "emitCorrectionEvent");
    const { correctInvoiceData } = await import(
      "@/features/invoices/server/actions/correct-invoice-data"
    );

    const result = await correctInvoiceData({
      invoiceId: invoice.id,
      corrections: {
        terms: "Updated terms",
      },
    });

    expect(result.ok).toBe(true);
    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "invoice.corrected",
        recordId: invoice.id,
        studioId: "default-studio",
      }),
    );
  });

  it("rejects invalid status regressions for paid invoices", async () => {
    const { invoice } = await seedInvoice();
    const { updateInvoiceStatus } = await import(
      "@/features/invoices/server/invoices-repository"
    );
    const { correctInvoiceData } = await import(
      "@/features/invoices/server/actions/correct-invoice-data"
    );

    await updateInvoiceStatus(invoice.id, "paid");

    const result = await correctInvoiceData({
      invoiceId: invoice.id,
      corrections: {
        status: "draft",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(
        "Paid invoices cannot change status during correction.",
      );
    }
  });
});
