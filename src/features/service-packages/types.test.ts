import { describe, expect, it } from "vitest";

import {
  calculateServicePackageTotalCents,
  createDefaultComplexityTiers,
  formatServicePackageStartingPriceLabel,
  toServicePackageSummary,
  type ServicePackageDetailRecord,
} from "@/features/service-packages/types";
import {
  COMPLEXITY_TIERS,
  SERVICE_CATEGORY_PROFILES,
} from "@/features/service-packages/catalog-contract";

const STRUCTURED_SERVICE_PACKAGE: ServicePackageDetailRecord = {
  id: "package-brand-launch",
  studioId: "default-studio",
  name: "Brand Launch Package",
  categoryKey: "ai-print-campaigns",
  categoryLabel: "AI Print Campaigns",
  categoryShortLabel: "Print",
  category: "Branding",
  shortDescription: "Launch-ready brand deliverables.",
  startingPriceLabel: "$2,400",
  packageTotalCents: 240000,
  complexityTiers: createDefaultComplexityTiers("ai-print-campaigns"),
  sections: [
    {
      id: "section-strategy",
      title: "Strategy",
      defaultContent: "Audience and messaging workshop.",
      position: 1,
      lineItems: [
        {
          id: "line-item-workshop",
          sectionId: "section-strategy",
          name: "Discovery workshop",
          defaultContent: "Half-day alignment session.",
          quantity: 1,
          unitLabel: "session",
          unitPriceCents: 120000,
          position: 1,
        },
      ],
    },
    {
      id: "section-delivery",
      title: "Delivery",
      defaultContent: "Core brand system deliverables.",
      position: 2,
      lineItems: [
        {
          id: "line-item-identity",
          sectionId: "section-delivery",
          name: "Brand identity system",
          defaultContent: "Logo, palette, and usage rules.",
          quantity: 1,
          unitLabel: "package",
          unitPriceCents: 120000,
          position: 1,
        },
      ],
    },
  ],
  createdAt: "2026-03-01T09:00:00.000Z",
  updatedAt: "2026-03-10T15:30:00.000Z",
};

describe("service package types", () => {
  it("exposes canonical catalog constants used by source-layer contracts", () => {
    expect(SERVICE_CATEGORY_PROFILES).toHaveLength(7);
    expect(COMPLEXITY_TIERS).toEqual(["standard", "advanced", "premium"]);
  });

  it("derives package totals from structured line items", () => {
    expect(calculateServicePackageTotalCents(STRUCTURED_SERVICE_PACKAGE.sections)).toBe(240000);
    expect(formatServicePackageStartingPriceLabel(240000)).toBe("$2,400");
  });

  it("preserves the library summary contract while exposing derived pricing", () => {
    expect(toServicePackageSummary(STRUCTURED_SERVICE_PACKAGE)).toEqual({
      id: "package-brand-launch",
      name: "Brand Launch Package",
      category: "Branding",
      startingPriceLabel: "$2,400",
      shortDescription: "Launch-ready brand deliverables.",
      updatedAt: "2026-03-10T15:30:00.000Z",
      packageTotalCents: 240000,
    });
  });
});
