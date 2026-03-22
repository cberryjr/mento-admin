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

describe("createInvoiceFromQuoteAction", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetInvoicesStore();
    __resetQuotesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  it("creates an invoice from an accepted quote", async () => {
    const quotesRepo = await import("@/features/quotes/server/quotes-repository");
    const { createInvoiceFromQuoteAction } = await import(
      "@/features/invoices/server/actions/create-invoice-from-quote"
    );

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

    const result = await createInvoiceFromQuoteAction({ quoteId: quote.id });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.invoice.status).toBe("draft");
      expect(result.data.invoice.sourceQuoteId).toBe(quote.id);
      expect(result.data.invoice.clientId).toBe("client-sunrise-yoga");
      expect(result.data.invoice.title).toBe("Test Quote");
      expect(result.data.invoice.sourceQuote).toEqual({
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        title: "Test Quote",
      });
      expect(result.data.invoice.client?.name).toBe("Sunrise Yoga Studio");
      expect(result.data.invoice.sections.map((section) => section.title)).toEqual([
        "Scope",
      ]);
      expect(result.data.invoice.sections[0].lineItems[0].name).toBe("Design");
    }
  });

  it("rejects when quote is not accepted", async () => {
    const quotesRepo = await import("@/features/quotes/server/quotes-repository");
    const { createInvoiceFromQuoteAction } = await import(
      "@/features/invoices/server/actions/create-invoice-from-quote"
    );

    const quote = await quotesRepo.createQuoteRecord("default-studio", {
      clientId: "client-sunrise-yoga",
      title: "Draft Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    const result = await createInvoiceFromQuoteAction({ quoteId: quote.id });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(
        "Only accepted quotes can be converted to invoices.",
      );
    }
  });

  it("rejects when quote is already invoiced", async () => {
    const quotesRepo = await import("@/features/quotes/server/quotes-repository");
    const { createInvoiceFromQuoteAction } = await import(
      "@/features/invoices/server/actions/create-invoice-from-quote"
    );

    const quote = await quotesRepo.createQuoteRecord("default-studio", {
      clientId: "client-sunrise-yoga",
      title: "Invoiced Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
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
        lineItems: [],
      },
    ]);

    await quotesRepo.updateQuoteStatus(quote.id, "accepted");
    await quotesRepo.updateQuoteStatus(quote.id, "invoiced");

    const result = await createInvoiceFromQuoteAction({ quoteId: quote.id });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(
        "Only accepted quotes can be converted to invoices.",
      );
    }
  });

  it("rejects when quote not found", async () => {
    const { createInvoiceFromQuoteAction } = await import(
      "@/features/invoices/server/actions/create-invoice-from-quote"
    );

    const result = await createInvoiceFromQuoteAction({
      quoteId: "nonexistent",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Quote not found.");
    }
  });

  it("rejects when user lacks studio access", async () => {
    const quotesRepo = await import("@/features/quotes/server/quotes-repository");
    const { requireSession } = await import("@/features/auth/require-session");
    const { createInvoiceFromQuoteAction } = await import(
      "@/features/invoices/server/actions/create-invoice-from-quote"
    );

    vi.mocked(requireSession).mockResolvedValue(setSession("other-studio"));

    const quote = await quotesRepo.createQuoteRecord("default-studio", {
      clientId: "client-sunrise-yoga",
      title: "Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
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
        lineItems: [],
      },
    ]);

    await quotesRepo.updateQuoteStatus(quote.id, "accepted");

    const result = await createInvoiceFromQuoteAction({ quoteId: quote.id });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Quote not found.");
    }
  });

  it("rejects with validation error for empty quoteId", async () => {
    const { createInvoiceFromQuoteAction } = await import(
      "@/features/invoices/server/actions/create-invoice-from-quote"
    );

    const result = await createInvoiceFromQuoteAction({ quoteId: "" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors).toBeDefined();
    }
  });

  it("updates quote status to invoiced after conversion", async () => {
    const quotesRepo = await import("@/features/quotes/server/quotes-repository");
    const { createInvoiceFromQuoteAction } = await import(
      "@/features/invoices/server/actions/create-invoice-from-quote"
    );

    const quote = await quotesRepo.createQuoteRecord("default-studio", {
      clientId: "client-sunrise-yoga",
      title: "Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
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
        lineItems: [],
      },
    ]);

    await quotesRepo.updateQuoteStatus(quote.id, "accepted");

    const result = await createInvoiceFromQuoteAction({ quoteId: quote.id });

    expect(result.ok).toBe(true);

    const updatedQuote = await quotesRepo.getQuoteById(quote.id);
    expect(updatedQuote?.status).toBe("invoiced");
  });
});
