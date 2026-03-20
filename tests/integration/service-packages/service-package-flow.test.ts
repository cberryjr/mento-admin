import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultComplexityTiers } from "@/features/service-packages/types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

function buildStructuredInput() {
  return {
    name: "Website Refresh Package",
    categoryKey: "ai-print-campaigns" as const,
    categoryLabel: "AI Print Campaigns",
    categoryShortLabel: "Print",
    category: "AI Print Campaigns",
    shortDescription: "Refresh a marketing site for relaunch.",
    complexityTiers: createDefaultComplexityTiers("ai-print-campaigns"),
    sections: [
      {
        id: "section-discovery",
        title: "Discovery",
        defaultContent: "Audit and kickoff work.",
        position: 1,
        lineItems: [
          {
            id: "line-item-audit",
            sectionId: "section-discovery",
            name: "Site audit",
            defaultContent: "Audit current pages and conversion gaps.",
            quantity: 1,
            unitLabel: "audit",
            unitPriceCents: 75000,
            position: 1,
          },
        ],
      },
      {
        id: "section-delivery",
        title: "Delivery",
        defaultContent: "Design and implementation support.",
        position: 2,
        lineItems: [
          {
            id: "line-item-pages",
            sectionId: "section-delivery",
            name: "Page redesign",
            defaultContent: "Refresh homepage and sales page.",
            quantity: 2,
            unitLabel: "page",
            unitPriceCents: 125000,
            position: 1,
          },
        ],
      },
    ],
  };
}

describe("service package integration flow", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const { __resetServicePackagesStore } = await import(
      "@/features/service-packages/server/service-packages-repository"
    );
    __resetServicePackagesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });
  });

  it("creates a structured package, reopens it, updates it, and preserves nested integrity", async () => {
    const { createServicePackage } = await import(
      "@/features/service-packages/server/actions/create-service-package"
    );
    const { updateServicePackage } = await import(
      "@/features/service-packages/server/actions/update-service-package"
    );
    const { getServicePackageById } = await import(
      "@/features/service-packages/server/queries/get-service-package-by-id"
    );
    const { listServicePackages } = await import(
      "@/features/service-packages/server/queries/list-service-packages"
    );

    const createResult = await createServicePackage(buildStructuredInput());

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) {
      return;
    }

    expect(createResult.data.servicePackage.packageTotalCents).toBe(325000);
    expect(createResult.data.servicePackage.startingPriceLabel).toBe("$3,250");

    const listResult = await listServicePackages();
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      const createdSummary = listResult.data.servicePackages.find(
        (servicePackage) => servicePackage.id === createResult.data.servicePackage.id,
      );

      expect(createdSummary).toMatchObject({
        name: "Website Refresh Package",
        packageTotalCents: 325000,
        startingPriceLabel: "$3,250",
      });
    }

    const reopenResult = await getServicePackageById(createResult.data.servicePackage.id);
    expect(reopenResult.ok).toBe(true);
    if (reopenResult.ok) {
      expect(reopenResult.data.servicePackage.sections).toHaveLength(2);
      expect(reopenResult.data.servicePackage.sections[1].lineItems[0]).toMatchObject({
        name: "Page redesign",
        quantity: 2,
        unitPriceCents: 125000,
      });
    }

    const updateResult = await updateServicePackage(createResult.data.servicePackage.id, {
      name: "Website Refresh Package",
      categoryKey: "ai-print-campaigns",
      categoryLabel: "AI Print Campaigns",
      categoryShortLabel: "Print",
      category: "AI Print Campaigns",
      shortDescription: "Refresh and relaunch support.",
      complexityTiers: createDefaultComplexityTiers("ai-print-campaigns"),
      sections: [
        {
          id: "section-discovery",
          title: "Discovery",
          defaultContent: "Audit and strategy alignment.",
          position: 1,
          lineItems: [
            {
              id: "line-item-audit",
              sectionId: "section-discovery",
              name: "Site audit",
              defaultContent: "Audit current pages and conversion gaps.",
              quantity: 1,
              unitLabel: "audit",
              unitPriceCents: 90000,
              position: 1,
            },
          ],
        },
        {
          id: "section-delivery",
          title: "Delivery",
          defaultContent: "Design and implementation support.",
          position: 2,
          lineItems: [
            {
              id: "line-item-pages",
              sectionId: "section-delivery",
              name: "Page redesign",
              defaultContent: "Refresh homepage and sales page.",
              quantity: 2,
              unitLabel: "page",
              unitPriceCents: 125000,
              position: 1,
            },
            {
              id: "line-item-handoff",
              sectionId: "section-delivery",
              name: "Launch handoff",
              defaultContent: "Go-live checklist and walkthrough.",
              quantity: 1,
              unitLabel: "handoff",
              unitPriceCents: 30000,
              position: 2,
            },
          ],
        },
      ],
    });

    expect(updateResult.ok).toBe(true);
    if (!updateResult.ok) {
      return;
    }

    expect(updateResult.data.servicePackage.category).toBe("AI Print Campaigns");
    expect(updateResult.data.servicePackage.packageTotalCents).toBe(370000);
    expect(updateResult.data.servicePackage.sections[1].lineItems).toHaveLength(2);

    const detailResult = await getServicePackageById(createResult.data.servicePackage.id);
    expect(detailResult.ok).toBe(true);
    if (detailResult.ok) {
      expect(detailResult.data.servicePackage.category).toBe("AI Print Campaigns");
      expect(detailResult.data.servicePackage.sections[0].lineItems).toHaveLength(1);
      expect(detailResult.data.servicePackage.sections[1].lineItems).toHaveLength(2);
      expect(detailResult.data.servicePackage.sections[1].lineItems[1]).toMatchObject({
        name: "Launch handoff",
        unitPriceCents: 30000,
      });
    }
  });

  it("returns standard error envelopes for nested validation and authz denials", async () => {
    const { updateServicePackage } = await import(
      "@/features/service-packages/server/actions/update-service-package"
    );

    const invalidResult = await updateServicePackage("package-brand-launch", {
      name: "",
      categoryKey: "ai-print-campaigns",
      categoryLabel: "AI Print Campaigns",
      categoryShortLabel: "Print",
      category: "",
      shortDescription: "",
      complexityTiers: [],
      sections: [],
    });

    expect(invalidResult).toMatchObject({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please correct the highlighted fields.",
      },
    });

    const authzResult = await updateServicePackage("package-other-studio", {
      name: "Hidden Orchard Package",
      categoryKey: "ai-animation-ads",
      categoryLabel: "AI Animation Ads",
      categoryShortLabel: "Animation Ads",
      category: "Campaign",
      shortDescription: "Other studio package.",
      complexityTiers: createDefaultComplexityTiers("ai-animation-ads"),
      sections: [
        {
          id: "section-campaign",
          title: "Campaign",
          defaultContent: "Other studio package details.",
          position: 1,
          lineItems: [
            {
              id: "line-item-campaign",
              sectionId: "section-campaign",
              name: "Campaign package",
              defaultContent: "Other studio package used for auth coverage.",
              quantity: 1,
              unitLabel: "package",
              unitPriceCents: 190000,
              position: 1,
            },
          ],
        },
      ],
    });

    expect(authzResult).toEqual({
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Service package not found.",
      },
    });
  });
});
