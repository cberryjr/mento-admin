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

async function seedInvoice() {
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
  return invoicesRepo.createInvoiceFromQuote("default-studio", quote.id);
}

describe("updateInvoiceAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetInvoicesStore();
    __resetQuotesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  it("updates invoice header fields on a draft invoice", async () => {
    const invoice = await seedInvoice();
    const { updateInvoiceAction } = await import(
      "@/features/invoices/server/actions/update-invoice"
    );

    const result = await updateInvoiceAction({
      invoiceId: invoice.id,
      title: "Updated Title",
      issueDate: "2026-01-15",
      dueDate: "2026-02-15",
      terms: "Updated terms",
      paymentInstructions: "Pay via bank transfer",
      sections: [],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.invoice.title).toBe("Updated Title");
      expect(result.data.invoice.terms).toBe("Updated terms");
      expect(result.data.invoice.paymentInstructions).toBe(
        "Pay via bank transfer",
      );
    }
  });

  it("updates sections and line items on a draft invoice", async () => {
    const invoice = await seedInvoice();
    const { updateInvoiceAction } = await import(
      "@/features/invoices/server/actions/update-invoice"
    );

    const result = await updateInvoiceAction({
      invoiceId: invoice.id,
      title: invoice.title,
      issueDate: null,
      dueDate: null,
      terms: "",
      paymentInstructions: "",
      sections: [
        {
          id: invoice.sections[0].id,
          title: "Updated Section",
          content: "New content",
          position: 0,
          lineItems: [
            {
              id: invoice.sections[0].lineItems[0].id,
              name: "Updated Design",
              content: "Updated description",
              quantity: 2,
              unitLabel: "hours",
              unitPriceCents: 25000,
              position: 0,
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.invoice.sections[0].title).toBe("Updated Section");
      expect(result.data.invoice.sections[0].lineItems[0].name).toBe(
        "Updated Design",
      );
      expect(result.data.invoice.sections[0].lineItems[0].quantity).toBe(2);
      expect(
        result.data.invoice.sections[0].lineItems[0].lineTotalCents,
      ).toBe(50000);
    }
  });

  it("rejects edits on non-draft invoices", async () => {
    const invoice = await seedInvoice();

    const store = await import("@/features/invoices/server/store/invoices-store");
    store.setInvoiceStatusInStore(invoice.id, "sent");

    const { updateInvoiceAction } = await import(
      "@/features/invoices/server/actions/update-invoice"
    );

    const result = await updateInvoiceAction({
      invoiceId: invoice.id,
      title: "Updated Title",
      issueDate: null,
      dueDate: null,
      terms: "",
      paymentInstructions: "",
      sections: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Only draft invoices can be edited.");
    }
  });

  it("rejects when user lacks studio access", async () => {
    const invoice = await seedInvoice();
    const { requireSession } = await import("@/features/auth/require-session");

    vi.mocked(requireSession).mockResolvedValue(setSession("other-studio"));

    const { updateInvoiceAction } = await import(
      "@/features/invoices/server/actions/update-invoice"
    );

    const result = await updateInvoiceAction({
      invoiceId: invoice.id,
      title: "Updated Title",
      issueDate: null,
      dueDate: null,
      terms: "",
      paymentInstructions: "",
      sections: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Invoice not found.");
    }
  });

  it("rejects when invoice not found", async () => {
    const { updateInvoiceAction } = await import(
      "@/features/invoices/server/actions/update-invoice"
    );

    const result = await updateInvoiceAction({
      invoiceId: "nonexistent",
      title: "Updated Title",
      issueDate: null,
      dueDate: null,
      terms: "",
      paymentInstructions: "",
      sections: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Invoice not found.");
    }
  });

  it("rejects with validation error for invalid input", async () => {
    const invoice = await seedInvoice();
    const { updateInvoiceAction } = await import(
      "@/features/invoices/server/actions/update-invoice"
    );

    const result = await updateInvoiceAction({
      invoiceId: invoice.id,
      title: "",
      issueDate: null,
      dueDate: null,
      terms: "",
      paymentInstructions: "",
      sections: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors).toBeDefined();
    }
  });

  it("returns nested field errors for invalid line item edits", async () => {
    const invoice = await seedInvoice();
    const { updateInvoiceAction } = await import(
      "@/features/invoices/server/actions/update-invoice"
    );

    const result = await updateInvoiceAction({
      invoiceId: invoice.id,
      title: invoice.title,
      issueDate: null,
      dueDate: null,
      terms: "",
      paymentInstructions: "",
      sections: [
        {
          id: invoice.sections[0].id,
          title: invoice.sections[0].title,
          content: invoice.sections[0].content,
          position: 0,
          lineItems: [
            {
              id: invoice.sections[0].lineItems[0].id,
              name: "",
              content: "",
              quantity: 0,
              unitLabel: "hours",
              unitPriceCents: 100,
              position: 0,
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.fieldErrors?.["sections.0.lineItems.0.name"]).toEqual([
        "Line item name is required.",
      ]);
      expect(result.error.fieldErrors?.["sections.0.lineItems.0.quantity"]).toEqual([
        "Quantity must be greater than zero.",
      ]);
    }
  });

  it("rejects invalid date strings before persistence", async () => {
    const invoice = await seedInvoice();
    const { updateInvoiceAction } = await import(
      "@/features/invoices/server/actions/update-invoice"
    );

    const result = await updateInvoiceAction({
      invoiceId: invoice.id,
      title: invoice.title,
      issueDate: "2026-02-31",
      dueDate: "not-a-date",
      terms: "",
      paymentInstructions: "",
      sections: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.fieldErrors?.issueDate).toEqual([
        "Enter a valid date in YYYY-MM-DD format.",
      ]);
      expect(result.error.fieldErrors?.dueDate).toEqual([
        "Enter a valid date in YYYY-MM-DD format.",
      ]);
    }
  });
});
