import { describe, expect, it } from "vitest";

import {
  getServicePackageFieldErrors,
  servicePackageSchema,
} from "@/features/service-packages/schemas/service-package-schema";
import { createDefaultComplexityTiers } from "@/features/service-packages/types";
import type { ServicePackageInput } from "@/features/service-packages/types";

describe("servicePackageSchema", () => {
  it("accepts a valid service package payload", () => {
    const parsed = servicePackageSchema.parse({
      name: "Brand Launch Package",
      categoryKey: "ai-print-campaigns",
      categoryLabel: "AI Print Campaigns",
      categoryShortLabel: "Print",
      category: "Branding",
      shortDescription: "A reusable package for launch-ready brand work.",
      complexityTiers: createDefaultComplexityTiers("ai-print-campaigns"),
      sections: [
        {
          id: "section-brand-strategy",
          title: "Brand strategy",
          defaultContent: "Core strategy and positioning work.",
          position: 1,
          lineItems: [
            {
              id: "line-item-workshop",
              sectionId: "section-brand-strategy",
              name: "Discovery workshop",
              defaultContent: "Half-day alignment session.",
              quantity: 1,
              unitLabel: "session",
              unitPriceCents: 120000,
              position: 1,
            },
          ],
        },
      ],
    });

    expect(parsed.name).toBe("Brand Launch Package");
    expect(parsed.category).toBe("Branding");
    expect(parsed.shortDescription).toContain("launch-ready");
    expect(parsed.sections[0].lineItems[0].unitPriceCents).toBe(120000);
  });

  it("returns path-aware field errors for nested invalid values", () => {
    const input: ServicePackageInput = {
      name: "",
      categoryKey: "ai-print-campaigns",
      categoryLabel: "AI Print Campaigns",
      categoryShortLabel: "Print",
      category: "",
      shortDescription:
        "This description is intentionally much longer than the schema should allow when summary text becomes too verbose for the library and picker surfaces.",
      complexityTiers: [
        {
          id: "ai-print-campaigns-standard",
          tier: "standard",
          title: "Standard",
          descriptor: "",
          deliverables: [""],
          processNotes: [""],
          timeGuidance: { minValue: 2, maxValue: 1, unit: "day" },
          variableDefaults: {
            quantity: 0,
            durationValue: null,
            durationUnit: "day",
            resolution: "hd",
            revisions: -1,
            urgency: "standard",
          },
          position: 1,
        },
      ],
      sections: [
        {
          id: "section-brand-strategy",
          title: "",
          defaultContent: "",
          position: 0,
          lineItems: [
            {
              id: "line-item-workshop",
              sectionId: "section-brand-strategy",
              name: "",
              defaultContent: "",
              quantity: 0,
              unitLabel: "",
              unitPriceCents: -1,
              position: 0,
            },
          ],
        },
      ],
    };

    const result = servicePackageSchema.safeParse({
      ...input,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = getServicePackageFieldErrors(input, result.error);
      expect(fieldErrors.name?.length).toBeGreaterThan(0);
      expect(fieldErrors.category?.length).toBeGreaterThan(0);
      expect(fieldErrors.shortDescription?.length).toBeGreaterThan(0);
      expect(fieldErrors["complexityTiersById.ai-print-campaigns-standard.descriptor"]?.length).toBeGreaterThan(0);
      expect(fieldErrors["sectionsById.section-brand-strategy.title"]?.length).toBeGreaterThan(
        0,
      );
      expect(fieldErrors["lineItemsById.line-item-workshop.name"]?.length).toBeGreaterThan(0);
      expect(fieldErrors["lineItemsById.line-item-workshop.quantity"]?.length).toBeGreaterThan(
        0,
      );
      expect(
        fieldErrors["lineItemsById.line-item-workshop.unitPriceCents"]?.length,
      ).toBeGreaterThan(0);
    }
  });

  it("requires at least one section with at least one line item", () => {
    const result = servicePackageSchema.safeParse({
      name: "Brand Launch Package",
      categoryKey: "ai-print-campaigns",
      categoryLabel: "AI Print Campaigns",
      categoryShortLabel: "Print",
      category: "Branding",
      shortDescription: "Launch assets and rollout support.",
      complexityTiers: createDefaultComplexityTiers("ai-print-campaigns"),
      sections: [],
    });

    expect(result.success).toBe(false);
  });
});
