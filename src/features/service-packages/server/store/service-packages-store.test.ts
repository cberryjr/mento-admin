import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultComplexityTiers } from "@/features/service-packages/types";

import {
  __resetServicePackagesStore,
  createServicePackageInStore,
  readServicePackageByIdFromStore,
  readServicePackagesFromStore,
} from "@/features/service-packages/server/store/service-packages-store";

describe("servicePackagesStore", () => {
  beforeEach(() => {
    __resetServicePackagesStore();
  });

  it("creates structured packages with derived pricing summaries", () => {
    const created = createServicePackageInStore("default-studio", {
      name: "Website Refresh Package",
      categoryKey: "ai-print-campaigns",
      categoryLabel: "AI Print Campaigns",
      categoryShortLabel: "Print",
      category: "Web",
      shortDescription: "Refresh and relaunch support.",
      complexityTiers: createDefaultComplexityTiers("ai-print-campaigns"),
      sections: [
        {
          id: "section-web",
          title: "Website",
          defaultContent: "Core site refresh work.",
          position: 1,
          lineItems: [
            {
              id: "line-item-pages",
              sectionId: "section-web",
              name: "Page redesign",
              defaultContent: "Homepage and sales page refresh.",
              quantity: 2,
              unitLabel: "page",
              unitPriceCents: 125000,
              position: 1,
            },
          ],
        },
      ],
    });

    expect(created.packageTotalCents).toBe(250000);
    expect(created.startingPriceLabel).toBe("$2,500");
    expect(created.categoryKey).toBe("ai-print-campaigns");
    expect(created.complexityTiers).toHaveLength(3);
  });

  it("deep copies nested package data on writes so input mutation cannot corrupt stored data", () => {
    const input = {
      name: "Mutable Package",
      categoryKey: "ai-print-campaigns" as const,
      categoryLabel: "AI Print Campaigns",
      categoryShortLabel: "Print",
      category: "Test",
      shortDescription: "Testing write isolation.",
      complexityTiers: createDefaultComplexityTiers("ai-print-campaigns"),
      sections: [
        {
          id: "section-mutable",
          title: "Mutable Section",
          defaultContent: "Original content.",
          position: 1,
          lineItems: [
            {
              id: "line-item-mutable",
              sectionId: "section-mutable",
              name: "Mutable Line Item",
              defaultContent: "Original line item content.",
              quantity: 1,
              unitLabel: "item",
              unitPriceCents: 50000,
              position: 1,
            },
          ],
        },
      ],
    };

    const created = createServicePackageInStore("default-studio", input);

    // Mutate the input object AFTER creating
    input.sections[0].title = "Mutated after create";
    input.sections[0].lineItems[0].name = "Mutated line item after create";
    input.complexityTiers[0].deliverables[0] = "Mutated deliverable";

    const reloaded = readServicePackageByIdFromStore(created.id);
    expect(reloaded?.sections[0].title).toBe("Mutable Section");
    expect(reloaded?.sections[0].lineItems[0].name).toBe("Mutable Line Item");
    expect(reloaded?.complexityTiers[0].deliverables[0]).not.toBe("Mutated deliverable");
  });

  it("deep copies nested package data on reads", () => {
    const servicePackage = readServicePackageByIdFromStore("package-brand-launch");
    expect(servicePackage).not.toBeNull();
    if (!servicePackage) {
      return;
    }

    servicePackage.sections[0].title = "Mutated title";
    servicePackage.sections[0].lineItems[0].name = "Mutated line item";

    const reloaded = readServicePackageByIdFromStore("package-brand-launch");
    expect(reloaded?.sections[0].title).toBe("Strategy");
    expect(reloaded?.sections[0].lineItems[0].name).toBe("Discovery workshop");

    const listed = readServicePackagesFromStore("default-studio");
    listed[0].sections[0].title = "Another mutation";

    const reloadedAfterListRead = readServicePackageByIdFromStore("package-brand-launch");
    expect(reloadedAfterListRead?.sections[0].title).toBe("Strategy");
  });
});
