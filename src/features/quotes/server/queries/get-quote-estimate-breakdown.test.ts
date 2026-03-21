import { beforeEach, describe, expect, it, vi } from "vitest";

import { __resetQuotesStore } from "@/features/quotes/server/store/quotes-store";

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

vi.mock(
  "@/features/service-packages/server/queries/get-service-package-by-id",
  () => ({
    getServicePackageById: vi.fn(),
  }),
);

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
    name: "Test Package",
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

describe("getQuoteEstimateBreakdown", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  it("computes breakdown for a quote with sections", async () => {
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { getServicePackageById } = await import(
      "@/features/service-packages/server/queries/get-service-package-by-id"
    );
    const { getQuoteEstimateBreakdown } = await import(
      "@/features/quotes/server/queries/get-quote-estimate-breakdown"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
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
        content: "",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            quoteId: quote.id,
            quoteSectionId: "qs-1",
            studioId: "default-studio",
            name: "Logo design",
            content: "",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 50000,
            lineTotalCents: 50000,
            position: 1,
          },
        ],
      },
    ]);

    vi.mocked(getServicePackageById).mockResolvedValue({
      ok: true,
      data: { servicePackage: makeServicePackage("sp-1") },
    });

    const result = await getQuoteEstimateBreakdown(quote.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.quoteId).toBe(quote.id);
    expect(result.data.computedAt).toBeTruthy();
    expect(result.data.sectionBreakdowns).toHaveLength(1);
    expect(result.data.sectionBreakdowns[0].sectionTitle).toBe("Design");
    expect(result.data.sectionBreakdowns[0].source.servicePackageName).toBe(
      "Test Package",
    );
    expect(
      result.data.sectionBreakdowns[0].breakdown.roleBreakdown.length,
    ).toBeGreaterThan(0);
    expect(result.data.grandTotal.internalCostCents).toBeGreaterThan(0);
    expect(result.data.grandTotal.finalPriceCents).toBe(50000);
  });

  it("handles quotes with no sections", async () => {
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );
    const { getQuoteEstimateBreakdown } = await import(
      "@/features/quotes/server/queries/get-quote-estimate-breakdown"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Empty Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    const result = await getQuoteEstimateBreakdown(quote.id);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.sectionBreakdowns).toHaveLength(0);
    expect(result.data.grandTotal.internalCostCents).toBe(0);
  });

  it("returns error for non-existent quote", async () => {
    const { getQuoteEstimateBreakdown } = await import(
      "@/features/quotes/server/queries/get-quote-estimate-breakdown"
    );

    const result = await getQuoteEstimateBreakdown("nonexistent-id");

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
    const { getQuoteEstimateBreakdown } = await import(
      "@/features/quotes/server/queries/get-quote-estimate-breakdown"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Other Studio Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    const result = await getQuoteEstimateBreakdown(quote.id);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe("Quote not found.");
  });
});
