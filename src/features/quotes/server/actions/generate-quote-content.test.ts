import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetQuotesStore,
} from "@/features/quotes/server/store/quotes-store";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/features/service-packages/server/service-packages-repository", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/features/service-packages/server/service-packages-repository")
  >();

  return {
    ...actual,
    getServicePackageById: vi.fn(),
    listServicePackagesForStudio: vi.fn(),
  };
});

describe("generateQuoteContent action", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();

    const { getServicePackageById, listServicePackagesForStudio } = await import(
      "@/features/service-packages/server/service-packages-repository"
    );

    vi.mocked(getServicePackageById).mockResolvedValue(null);
    vi.mocked(listServicePackagesForStudio).mockResolvedValue([]);
  });

  it("generates quote content from selected service packages", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { getServicePackageById } = await import(
      "@/features/service-packages/server/service-packages-repository"
    );
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "Net 30",
    });

    vi.mocked(getServicePackageById).mockResolvedValue({
      id: "sp-1",
      studioId: "default-studio",
      name: "Brand Package",
      categoryKey: "ai-print-campaigns",
      categoryLabel: "AI Print Campaigns",
      categoryShortLabel: "Print",
      category: "AI Print Campaigns",
      startingPriceLabel: "$500",
      shortDescription: "Brand design package",
      packageTotalCents: 50000,
      createdAt: "2026-03-19T00:00:00.000Z",
      updatedAt: "2026-03-19T00:00:00.000Z",
      complexityTiers: [],
      sections: [
        {
          id: "sp-section-1",
          title: "Logo Design",
          defaultContent: "Custom logo design",
          position: 1,
          lineItems: [
            {
              id: "sp-li-1",
              sectionId: "sp-section-1",
              name: "Logo Concepts",
              defaultContent: "3 logo concepts",
              quantity: 3,
              unitLabel: "concepts",
              unitPriceCents: 10000,
              position: 1,
            },
          ],
        },
      ],
    });

    const { generateQuoteContent } = await import(
      "@/features/quotes/server/actions/generate-quote-content"
    );

    const result = await generateQuoteContent({ quoteId: quote.id });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.sections).toHaveLength(1);
      expect(result.data.quote.sections[0].title).toBe("Logo Design");
      expect(result.data.quote.sections[0].lineItems).toHaveLength(1);
      expect(result.data.quote.sections[0].lineItems[0].name).toBe(
        "Logo Concepts"
      );
      expect(result.data.quote.sections[0].lineItems[0].lineTotalCents).toBe(
        30000
      );
      expect(result.data.quote.generatedAt).toBeTruthy();
    }
  });

  it("generates content for a draft quote with packages selected", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { getServicePackageById } = await import(
      "@/features/service-packages/server/service-packages-repository"
    );
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    vi.mocked(getServicePackageById).mockResolvedValue({
      id: "sp-1",
      studioId: "default-studio",
      name: "Brand Package",
      categoryKey: "ai-print-campaigns",
      categoryLabel: "AI Print Campaigns",
      categoryShortLabel: "Print",
      category: "AI Print Campaigns",
      startingPriceLabel: "$500",
      shortDescription: "",
      packageTotalCents: 50000,
      createdAt: "2026-03-19T00:00:00.000Z",
      updatedAt: "2026-03-19T00:00:00.000Z",
      complexityTiers: [],
      sections: [],
    });

    const { generateQuoteContent } = await import(
      "@/features/quotes/server/actions/generate-quote-content"
    );

    const result = await generateQuoteContent({ quoteId: quote.id });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.generatedAt).toBeTruthy();
    }
  });

  it("rejects generation when no packages selected", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    const { generateQuoteContent } = await import(
      "@/features/quotes/server/actions/generate-quote-content"
    );

    const result = await generateQuoteContent({ quoteId: quote.id });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("No service packages selected");
    }
  });

  it("rejects generation when service package not found", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: ["sp-nonexistent"],
      terms: "",
    });

    const { generateQuoteContent } = await import(
      "@/features/quotes/server/actions/generate-quote-content"
    );

    const result = await generateQuoteContent({ quoteId: quote.id });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("not found or no longer available");
    }
  });

  it("rejects generation when selected package is outside the studio scope", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { getServicePackageById } = await import(
      "@/features/service-packages/server/service-packages-repository"
    );
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Cross studio quote",
      selectedServicePackageIds: ["package-other-studio"],
      terms: "",
    });

    vi.mocked(getServicePackageById).mockResolvedValue({
      id: "package-other-studio",
      studioId: "other-studio",
      name: "Hidden Orchard Package",
      categoryKey: "ai-animation-ads",
      categoryLabel: "AI Animation Ads",
      categoryShortLabel: "Animation Ads",
      category: "Campaign",
      startingPriceLabel: "$1,900",
      shortDescription: "",
      packageTotalCents: 190000,
      createdAt: "2026-03-19T00:00:00.000Z",
      updatedAt: "2026-03-19T00:00:00.000Z",
      complexityTiers: [],
      sections: [],
    });

    const { generateQuoteContent } = await import(
      "@/features/quotes/server/actions/generate-quote-content"
    );

    const result = await generateQuoteContent({ quoteId: quote.id });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.message).toContain("not found or no longer available");
    }
  });

  it("rejects unauthenticated access", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { AppError } = await import("@/lib/errors/app-error");

    vi.mocked(requireSession).mockRejectedValue(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { generateQuoteContent } = await import(
      "@/features/quotes/server/actions/generate-quote-content"
    );

    const result = await generateQuoteContent({ quoteId: "q-1" });

    expect(result.ok).toBe(false);
  });

  it("resolves selected packages using the current studio scope", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { getServicePackageById } = await import(
      "@/features/service-packages/server/service-packages-repository"
    );
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Studio scoped quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    vi.mocked(getServicePackageById).mockResolvedValue({
      id: "sp-1",
      studioId: "default-studio",
      name: "Brand Package",
      categoryKey: "ai-print-campaigns",
      categoryLabel: "AI Print Campaigns",
      categoryShortLabel: "Print",
      category: "AI Print Campaigns",
      startingPriceLabel: "$500",
      shortDescription: "",
      packageTotalCents: 50000,
      createdAt: "2026-03-19T00:00:00.000Z",
      updatedAt: "2026-03-19T00:00:00.000Z",
      complexityTiers: [],
      sections: [],
    });

    const { generateQuoteContent } = await import(
      "@/features/quotes/server/actions/generate-quote-content"
    );

    const result = await generateQuoteContent({ quoteId: quote.id });

    expect(result.ok).toBe(true);
    expect(getServicePackageById).toHaveBeenCalledWith("sp-1");
  });

  it("generates sections from multiple service packages in order", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { getServicePackageById } = await import(
      "@/features/service-packages/server/service-packages-repository"
    );
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: ["sp-1", "sp-2"],
      terms: "",
    });

    vi.mocked(getServicePackageById)
      .mockResolvedValueOnce({
        id: "sp-1",
        studioId: "default-studio",
        name: "Package A",
        categoryKey: "ai-print-campaigns",
        categoryLabel: "AI Print Campaigns",
        categoryShortLabel: "Print",
        category: "AI Print Campaigns",
        startingPriceLabel: "$100",
        shortDescription: "",
        packageTotalCents: 10000,
        createdAt: "2026-03-19T00:00:00.000Z",
        updatedAt: "2026-03-19T00:00:00.000Z",
        complexityTiers: [],
        sections: [
          {
            id: "sp-s1",
            title: "Section A1",
            defaultContent: "",
            position: 1,
            lineItems: [],
          },
        ],
      })
      .mockResolvedValueOnce({
        id: "sp-2",
        studioId: "default-studio",
        name: "Package B",
        categoryKey: "ai-print-campaigns",
        categoryLabel: "AI Print Campaigns",
        categoryShortLabel: "Print",
        category: "AI Print Campaigns",
        startingPriceLabel: "$200",
        shortDescription: "",
        packageTotalCents: 20000,
        createdAt: "2026-03-19T00:00:00.000Z",
        updatedAt: "2026-03-19T00:00:00.000Z",
        complexityTiers: [],
        sections: [
          {
            id: "sp-s2",
            title: "Section B1",
            defaultContent: "",
            position: 1,
            lineItems: [],
          },
        ],
      });

    const { generateQuoteContent } = await import(
      "@/features/quotes/server/actions/generate-quote-content"
    );

    const result = await generateQuoteContent({ quoteId: quote.id });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.sections).toHaveLength(2);
      expect(result.data.quote.sections[0].title).toBe("Section A1");
      expect(result.data.quote.sections[0].sourceServicePackageId).toBe("sp-1");
      expect(result.data.quote.sections[1].title).toBe("Section B1");
      expect(result.data.quote.sections[1].sourceServicePackageId).toBe("sp-2");
    }
  });
});
