import { beforeEach, describe, expect, it, vi } from "vitest";

import { __resetInvoicesStore, createInvoiceInStore } from "@/features/invoices/server/store/invoices-store";
import {
  __resetQuotesStore,
  createQuoteInStore,
  createQuoteRevisionInStore,
  writeQuoteSectionsToStore,
} from "@/features/quotes/server/store/quotes-store";
import { __resetServicePackagesStore } from "@/features/service-packages/server/store/service-packages-store";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

function setSession(studioId = "default-studio") {
  return {
    user: {
      id: "user-1",
      email: "owner@example.com",
      studioId,
      role: "owner" as const,
    },
    expires: "2099-01-01T00:00:00.000Z",
  };
}

function seedQuote(options?: {
  studioId?: string;
  clientId?: string;
  selectedServicePackageIds?: string[];
}) {
  const quote = createQuoteInStore(options?.studioId ?? "default-studio", {
    clientId: options?.clientId ?? "client-sunrise-yoga",
    title: "Monthly brand retainer",
    selectedServicePackageIds: options?.selectedServicePackageIds ?? ["package-brand-launch"],
    terms: "Net 30",
  });

  writeQuoteSectionsToStore(quote.id, []);

  return quote;
}

function seedInvoice(quoteId: string, options?: { studioId?: string; clientId?: string }) {
  return createInvoiceInStore(
    options?.studioId ?? "default-studio",
    {
      clientId: options?.clientId ?? "client-sunrise-yoga",
      sourceQuoteId: quoteId,
      invoiceNumber: "INV-20260321-TEST1",
      title: "Monthly brand retainer",
      terms: "Net 30",
      sections: [],
    },
    { id: quoteId, quoteNumber: "Q-TEST", title: "Monthly brand retainer" },
    {
      id: options?.clientId ?? "client-sunrise-yoga",
      name: "Sunrise Yoga Studio",
      contactName: "Avery Patel",
      contactEmail: "ops@sunriseyoga.example",
      contactPhone: "+1 555 0101",
    },
  );
}

describe("getRecordHistory", () => {
  beforeEach(async () => {
    __resetQuotesStore();
    __resetInvoicesStore();
    __resetServicePackagesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  it("returns a client record chain with linked quotes and invoices", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    const quote = seedQuote();
    seedInvoice(quote.id);
    createQuoteRevisionInStore(quote.id, "default-studio");

    const result = await getRecordHistory({
      entityType: "client",
      entityId: "client-sunrise-yoga",
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.data.client.entityId).toBe("client-sunrise-yoga");
    expect(result.data.client.isCurrent).toBe(true);
    expect(result.data.quoteChain).toHaveLength(1);
    expect(result.data.quoteChain[0].quote.entityId).toBe(quote.id);
    expect(result.data.quoteChain[0].revisions).toHaveLength(1);
    expect(result.data.quoteChain[0].invoices).toHaveLength(1);
  });

  it("loads service package context for client history from quote sections", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    const quote = seedQuote({ selectedServicePackageIds: [] });
    writeQuoteSectionsToStore(quote.id, [
      {
        id: "section-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "package-brand-launch",
        title: "Discovery",
        content: "Scope alignment",
        position: 1,
        lineItems: [],
      },
    ]);

    const result = await getRecordHistory({
      entityType: "client",
      entityId: "client-sunrise-yoga",
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.data.quoteChain[0].quote.metadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Source packages",
          value: "Brand Launch Package",
        }),
      ]),
    );
  });

  it("returns an invoice record chain that traces back to the source quote", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    const quote = seedQuote();
    const invoice = seedInvoice(quote.id);
    createQuoteRevisionInStore(quote.id, "default-studio");

    const result = await getRecordHistory({
      entityType: "invoice",
      entityId: invoice.id,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.data.currentEntity.entityId).toBe(invoice.id);
    expect(result.data.quoteChain).toHaveLength(1);
    expect(result.data.quoteChain[0].quote.entityId).toBe(quote.id);
    expect(result.data.quoteChain[0].invoices[0].isCurrent).toBe(true);
    expect(result.data.currentEntity.relatedLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Open source quote",
          href: expect.stringContaining(`/quotes/${quote.id}`),
        }),
      ]),
    );
  });

  it("preserves history back navigation in generated record links", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    const quote = seedQuote();
    const invoice = seedInvoice(quote.id);
    const historyHref = "/records/history?type=invoice&id=invoice-1&backTo=%2Finvoices";

    const result = await getRecordHistory({
      entityType: "invoice",
      entityId: invoice.id,
      historyHref,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.data.client.href).toContain(encodeURIComponent(historyHref));
    expect(result.data.quoteChain[0].quote.href).toContain(encodeURIComponent(historyHref));
    expect(result.data.currentEntity.href).toContain(encodeURIComponent(historyHref));
  });

  it("returns an empty chain for a client with no related records", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    const result = await getRecordHistory({
      entityType: "client",
      entityId: "client-otter-coffee",
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.data.client.entityId).toBe("client-otter-coffee");
    expect(result.data.quoteChain).toHaveLength(0);
  });

  it("returns a not found result for a nonexistent entity", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    const result = await getRecordHistory({
      entityType: "client",
      entityId: "missing-client",
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Record not found.",
      },
    });
  });

  it("returns a not found result when the record belongs to another studio", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    const quote = seedQuote({
      studioId: "other-studio",
      clientId: "client-other-studio",
      selectedServicePackageIds: ["package-other-studio"],
    });

    const result = await getRecordHistory({
      entityType: "quote",
      entityId: quote.id,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Record not found.",
      },
    });
  });

  it("includes source service package names on quote nodes", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    const quote = seedQuote({
      selectedServicePackageIds: ["package-brand-launch", "package-content-sprint"],
    });

    const result = await getRecordHistory({
      entityType: "quote",
      entityId: quote.id,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.data.quoteChain[0].quote.metadata).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Source packages",
          value: "Brand Launch Package, Content Sprint Package",
        }),
      ]),
    );
  });

  it("returns a quote record chain with linked client and revisions", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    const quote = seedQuote();
    createQuoteRevisionInStore(quote.id, "default-studio");

    const result = await getRecordHistory({
      entityType: "quote",
      entityId: quote.id,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.data.currentEntity.entityId).toBe(quote.id);
    expect(result.data.currentEntity.isCurrent).toBe(true);
    expect(result.data.client.entityId).toBe("client-sunrise-yoga");
    expect(result.data.client.isCurrent).toBe(false);
    expect(result.data.quoteChain).toHaveLength(1);
    expect(result.data.quoteChain[0].revisions).toHaveLength(1);
  });

  it("returns an Unknown quote fallback for invoice with no sourceQuoteId", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    const invoice = createInvoiceInStore(
      "default-studio",
      {
        clientId: "client-sunrise-yoga",
        sourceQuoteId: "",
        invoiceNumber: "INV-TEST",
        title: "Manual invoice",
        terms: "Net 30",
        sections: [],
      },
      null,
      {
        id: "client-sunrise-yoga",
        name: "Sunrise Yoga Studio",
        contactName: "Avery Patel",
        contactEmail: "ops@sunriseyoga.example",
        contactPhone: "+1 555 0101",
      },
    );

    const result = await getRecordHistory({
      entityType: "invoice",
      entityId: invoice.id,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.data.currentEntity.entityId).toBe(invoice.id);
    expect(result.data.quoteChain).toHaveLength(1);
    expect(result.data.quoteChain[0].quote.entityId).toBe("unknown-quote");
    expect(result.data.quoteChain[0].quote.label).toBe("Unknown quote");
    expect(result.data.quoteChain[0].invoices).toHaveLength(1);
  });

  it("returns a not found result for invoice belonging to another studio", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    const quote = seedQuote({ studioId: "other-studio" });
    const invoice = seedInvoice(quote.id, { studioId: "other-studio" });

    const result = await getRecordHistory({
      entityType: "invoice",
      entityId: invoice.id,
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Record not found.",
      },
    });
  });
});
