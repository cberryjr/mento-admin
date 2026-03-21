import { beforeEach, describe, expect, it, vi } from "vitest";

import { __resetQuotesStore } from "@/features/quotes/server/store/quotes-store";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/features/clients/server/queries/get-client-by-id", () => ({
  getClientById: vi.fn(),
}));

vi.mock("@/features/studio-defaults/server/queries/get-studio-defaults", () => ({
  getStudioDefaults: vi.fn(),
}));

vi.mock("@/features/service-packages/server/queries/get-service-package-by-id", () => ({
  getServicePackageById: vi.fn(),
}));

function setSession(studioId = "default-studio") {
  return {
    user: {
      id: "owner-1",
      email: "owner@example.com",
      role: "owner" as const,
      studioId,
    },
    expires: new Date(Date.now() + 360000).toISOString(),
  };
}

function makeServicePackage(id: string) {
  return {
    id,
    studioId: "default-studio",
    name: "Brand Launch",
    categoryKey: "ai-print-campaigns" as const,
    categoryLabel: "AI Print Campaigns",
    categoryShortLabel: "Print",
    category: "AI Print Campaigns",
    startingPriceLabel: "$500",
    shortDescription: "Test",
    packageTotalCents: 50000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    complexityTiers: [
      {
        id: `${id}-standard`,
        tier: "standard" as const,
        title: "Standard",
        descriptor: "Fast production",
        deliverables: ["Print deliverable set"],
        processNotes: ["Prompt design"],
        timeGuidance: { minValue: 1, maxValue: 3, unit: "day" as const },
        variableDefaults: {
          quantity: 1,
          durationValue: null,
          durationUnit: null,
          resolution: "print" as const,
          revisions: 1,
          urgency: "standard" as const,
        },
        position: 1,
      },
    ],
    sections: [],
  };
}

describe("getQuotePreview", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  it("assembles a complete preview payload", async () => {
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { getClientById } = await import(
      "@/features/clients/server/queries/get-client-by-id"
    );
    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );
    const { getQuotePreview } = await import(
      "@/features/quotes/server/queries/get-quote-preview"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: [],
      terms: "Net 30",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: "qs-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Design",
        content: "Design services",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            quoteId: quote.id,
            quoteSectionId: "qs-1",
            studioId: "default-studio",
            name: "Logo design",
            content: "Custom logo",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 50000,
            lineTotalCents: 50000,
            position: 1,
          },
        ],
      },
    ]);

    vi.mocked(getClientById).mockResolvedValue({
      ok: true,
      data: {
        client: {
          id: "client-1",
          studioId: "default-studio",
          name: "Acme Corp",
          contactName: "Jane",
          contactEmail: "jane@acme.com",
          contactPhone: "555-1234",
          createdAt: "",
          updatedAt: "",
        },
        relatedQuotes: [],
        relatedInvoices: [],
      },
    });

    vi.mocked(getStudioDefaults).mockResolvedValue({
      ok: true,
      data: {
        studioDefaults: {
          studioId: "default-studio",
          studioName: "My Studio",
          studioContactName: "Owner",
          studioContactEmail: "owner@studio.com",
          studioContactPhone: "555-0000",
          defaultQuoteTerms: "Default terms",
          defaultInvoicePaymentInstructions: "",
          prefill: {
            studioName: "My Studio",
            studioContactDetails: { name: "Owner", email: "owner@studio.com", phone: "555-0000" },
            defaultQuoteTerms: "Default terms",
            defaultInvoicePaymentInstructions: "",
          },
          createdAt: "",
          updatedAt: "",
        },
      },
    });

    const result = await getQuotePreview(quote.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.quoteNumber).toBe(quote.quoteNumber);
    expect(result.data.title).toBe("Test Quote");
    expect(result.data.status).toBe("draft");
    expect(result.data.clientName).toBe("Acme Corp");
    expect(result.data.clientContact.name).toBe("Jane");
    expect(result.data.clientContact.email).toBe("jane@acme.com");
    expect(result.data.studioName).toBe("My Studio");
    expect(result.data.terms).toBe("Net 30");
    expect(result.data.grandTotalCents).toBe(50000);
    expect(result.data.sections).toHaveLength(1);
    expect(result.data.sections[0].lineItems[0].name).toBe("Logo design");
    expect(result.data.preparedAt).toBeTruthy();
  });

  it("falls back to studio defaults terms when quote has no terms", async () => {
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { getClientById } = await import(
      "@/features/clients/server/queries/get-client-by-id"
    );
    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );
    const { getQuotePreview } = await import(
      "@/features/quotes/server/queries/get-quote-preview"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "No Terms",
      selectedServicePackageIds: [],
      terms: "",
    });

    vi.mocked(getClientById).mockResolvedValue({
      ok: true,
      data: {
        client: {
          id: "client-1",
          studioId: "default-studio",
          name: "Acme",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          createdAt: "",
          updatedAt: "",
        },
        relatedQuotes: [],
        relatedInvoices: [],
      },
    });

    vi.mocked(getStudioDefaults).mockResolvedValue({
      ok: true,
      data: {
        studioDefaults: {
          studioId: "default-studio",
          studioName: "Studio",
          studioContactName: "",
          studioContactEmail: "",
          studioContactPhone: "",
          defaultQuoteTerms: "Studio default terms",
          defaultInvoicePaymentInstructions: "",
          prefill: {
            studioName: "Studio",
            studioContactDetails: { name: "", email: "", phone: "" },
            defaultQuoteTerms: "Studio default terms",
            defaultInvoicePaymentInstructions: "",
          },
          createdAt: "",
          updatedAt: "",
        },
      },
    });

    const result = await getQuotePreview(quote.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.terms).toBe("Studio default terms");
  });

  it("includes the persisted estimate breakdown snapshot when package-backed sections exist", async () => {
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { getClientById } = await import(
      "@/features/clients/server/queries/get-client-by-id"
    );
    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );
    const { getServicePackageById } = await import(
      "@/features/service-packages/server/queries/get-service-package-by-id"
    );
    const { getQuotePreview } = await import(
      "@/features/quotes/server/queries/get-quote-preview"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Snapshot Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: "qs-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "sp-1",
        title: "Design",
        content: "Design services",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            quoteId: quote.id,
            quoteSectionId: "qs-1",
            studioId: "default-studio",
            name: "Logo design",
            content: "Custom logo",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 50000,
            lineTotalCents: 50000,
            position: 1,
          },
        ],
      },
    ]);

    vi.mocked(getClientById).mockResolvedValue({
      ok: true,
      data: {
        client: {
          id: "client-1",
          studioId: "default-studio",
          name: "Acme Corp",
          contactName: "Jane",
          contactEmail: "jane@acme.com",
          contactPhone: "555-1234",
          createdAt: "",
          updatedAt: "",
        },
        relatedQuotes: [],
        relatedInvoices: [],
      },
    });

    vi.mocked(getStudioDefaults).mockResolvedValue({
      ok: true,
      data: { studioDefaults: null },
    });

    vi.mocked(getServicePackageById).mockResolvedValue({
      ok: true,
      data: { servicePackage: makeServicePackage("sp-1") },
    });

    const result = await getQuotePreview(quote.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.estimateBreakdown).not.toBeNull();
    expect(
      result.data.estimateBreakdown?.sectionBreakdowns[0].source.servicePackageName,
    ).toBe("Brand Launch");
  });

  it("handles missing studio defaults gracefully", async () => {
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { getClientById } = await import(
      "@/features/clients/server/queries/get-client-by-id"
    );
    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );
    const { getQuotePreview } = await import(
      "@/features/quotes/server/queries/get-quote-preview"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "No Defaults",
      selectedServicePackageIds: [],
      terms: "",
    });

    vi.mocked(getClientById).mockResolvedValue({
      ok: true,
      data: {
        client: {
          id: "client-1",
          studioId: "default-studio",
          name: "Acme",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          createdAt: "",
          updatedAt: "",
        },
        relatedQuotes: [],
        relatedInvoices: [],
      },
    });

    vi.mocked(getStudioDefaults).mockResolvedValue({
      ok: true,
      data: { studioDefaults: null },
    });

    const result = await getQuotePreview(quote.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.terms).toBe("");
    expect(result.data.studioName).toBe("");
  });

  it("returns error for non-existent quote", async () => {
    const { getQuotePreview } = await import(
      "@/features/quotes/server/queries/get-quote-preview"
    );

    const result = await getQuotePreview("nonexistent-id");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe("Quote not found.");
  });

  it("rejects cross-studio access", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession("other-studio"));

    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { getQuotePreview } = await import(
      "@/features/quotes/server/queries/get-quote-preview"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Other Studio Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    const result = await getQuotePreview(quote.id);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe("Quote not found.");
  });
});
