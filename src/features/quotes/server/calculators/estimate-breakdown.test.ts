import { describe, expect, it } from "vitest";

import {
  computeQuoteEstimateBreakdown,
  computeSectionEstimateBreakdown,
} from "@/features/quotes/server/calculators/estimate-breakdown";
import type { QuoteSectionRecord } from "@/features/quotes/types";
import type { ServicePackageDetailRecord } from "@/features/service-packages/types";

function makeSection(
  overrides: Partial<QuoteSectionRecord> = {},
): QuoteSectionRecord {
  return {
    id: "qs-1",
    quoteId: "q-1",
    studioId: "studio-1",
    sourceServicePackageId: "sp-1",
    title: "Design",
    content: "",
    position: 1,
    lineItems: [
      {
        id: "li-1",
        quoteId: "q-1",
        quoteSectionId: "qs-1",
        studioId: "studio-1",
        name: "Logo design",
        content: "Custom logo",
        quantity: 1,
        unitLabel: "item",
        unitPriceCents: 50000,
        lineTotalCents: 50000,
        position: 1,
      },
    ],
    ...overrides,
  };
}

function makePackage(
  overrides: Partial<ServicePackageDetailRecord> = {},
): ServicePackageDetailRecord {
  return {
    id: "sp-1",
    studioId: "studio-1",
    name: "Brand Launch",
    categoryKey: "ai-print-campaigns",
    categoryLabel: "AI Print Campaigns",
    categoryShortLabel: "Print",
    category: "AI Print Campaigns",
    startingPriceLabel: "$500",
    shortDescription: "Brand package",
    packageTotalCents: 50000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    complexityTiers: [
      {
        id: "sp-1-standard",
        tier: "standard",
        title: "Standard",
        descriptor: "Fast production, lower complexity",
        deliverables: ["Print deliverable set"],
        processNotes: ["Prompt design"],
        timeGuidance: { minValue: 1, maxValue: 3, unit: "day" },
        variableDefaults: {
          quantity: 1,
          durationValue: null,
          durationUnit: null,
          resolution: "print",
          revisions: 1,
          urgency: "standard",
        },
        position: 1,
      },
      {
        id: "sp-1-advanced",
        tier: "advanced",
        title: "Advanced",
        descriptor: "High-quality commercial work",
        deliverables: ["Print deliverable set", "Revision rounds"],
        processNotes: ["Prompt design", "Review pass"],
        timeGuidance: { minValue: 3, maxValue: 7, unit: "day" },
        variableDefaults: {
          quantity: 1,
          durationValue: null,
          durationUnit: null,
          resolution: "print",
          revisions: 2,
          urgency: "standard",
        },
        position: 2,
      },
      {
        id: "sp-1-premium",
        tier: "premium",
        title: "Premium",
        descriptor: "Top-tier campaign production",
        deliverables: ["Premium deliverable set", "Full revision suite"],
        processNotes: ["Prompt design", "Review pass", "Final polish"],
        timeGuidance: { minValue: 5, maxValue: 10, unit: "day" },
        variableDefaults: {
          quantity: 1,
          durationValue: null,
          durationUnit: null,
          resolution: "print",
          revisions: 3,
          urgency: "standard",
        },
        position: 3,
      },
    ],
    sections: [],
    ...overrides,
  };
}

describe("computeSectionEstimateBreakdown", () => {
  it("produces a deterministic breakdown for identical inputs", () => {
    const section = makeSection();
    const pkg = makePackage();

    const result1 = computeSectionEstimateBreakdown(section, pkg);
    const result2 = computeSectionEstimateBreakdown(section, pkg);

    expect(result1).not.toBeNull();
    expect(result2).not.toBeNull();
    expect(result1).toEqual(result2);
  });

  it("computes estimated hours from standard tier time range (days to hours)", () => {
    const section = makeSection();
    const pkg = makePackage();

    const result = computeSectionEstimateBreakdown(section, pkg, "standard");

    expect(result).not.toBeNull();
    expect(result!.breakdown.estimatedHours).toEqual({ min: 8, max: 24 });
  });

  it("converts week-based time ranges to hours correctly", () => {
    const section = makeSection();
    const pkg = makePackage({
      complexityTiers: [
        {
          id: "sp-1-standard",
          tier: "standard",
          title: "Standard",
          descriptor: "",
          deliverables: [],
          processNotes: [],
          timeGuidance: { minValue: 2, maxValue: 4, unit: "week" },
          variableDefaults: {
            quantity: 1,
            durationValue: null,
            durationUnit: null,
            resolution: "4k",
            revisions: 1,
            urgency: "standard",
          },
          position: 1,
        },
      ],
    });

    const result = computeSectionEstimateBreakdown(section, pkg, "standard");

    expect(result).not.toBeNull();
    expect(result!.breakdown.estimatedHours).toEqual({ min: 80, max: 160 });
  });

  it("derives role breakdown from ai-print-campaigns category", () => {
    const section = makeSection();
    const pkg = makePackage();

    const result = computeSectionEstimateBreakdown(section, pkg, "standard");

    expect(result).not.toBeNull();
    const roles = result!.breakdown.roleBreakdown;
    expect(roles.length).toBeGreaterThan(0);
    expect(roles.map((r) => r.role)).toContain("Creative Director");
    expect(roles.map((r) => r.role)).toContain("AI Artist");
    expect(roles.map((r) => r.role)).toContain("Editor/Compositor");

    for (const entry of roles) {
      expect(entry.hours).toBeGreaterThan(0);
      expect(entry.hourlyRateCents).toBeGreaterThan(0);
      expect(entry.costCents).toBeGreaterThan(0);
      expect(entry.costCents).toBe(Math.round(entry.hours * entry.hourlyRateCents));
    }
  });

  it("uses midpoint of hours range for role allocation", () => {
    const section = makeSection();
    const pkg = makePackage();

    const result = computeSectionEstimateBreakdown(section, pkg, "standard");

    expect(result).not.toBeNull();
    const midpointHours = (8 + 24) / 2;
    const totalRoleHours = result!.breakdown.roleBreakdown.reduce(
      (sum, r) => sum + r.hours,
      0,
    );

    expect(totalRoleHours).toBeCloseTo(midpointHours, 0);
  });

  it("uses line item subtotal as final price when sections have line items", () => {
    const section = makeSection();
    const pkg = makePackage();

    const result = computeSectionEstimateBreakdown(section, pkg, "standard");

    expect(result).not.toBeNull();
    expect(result!.breakdown.finalPriceCents).toBe(50000);
  });

  it("computes internal cost from role breakdown", () => {
    const section = makeSection();
    const pkg = makePackage();

    const result = computeSectionEstimateBreakdown(section, pkg, "standard");

    expect(result).not.toBeNull();
    const expectedInternalCost = result!.breakdown.roleBreakdown.reduce(
      (sum, r) => sum + r.costCents,
      0,
    );
    expect(result!.breakdown.internalCostCents).toBe(expectedInternalCost);
  });

  it("applies correct margin percent for standard tier", () => {
    const section = makeSection();
    const pkg = makePackage();

    const result = computeSectionEstimateBreakdown(section, pkg, "standard");

    expect(result).not.toBeNull();
    expect(result!.breakdown.marginPercent).toBe(0.3);
    expect(result!.breakdown.marginCents).toBe(
      Math.round(result!.breakdown.internalCostCents * 0.3),
    );
  });

  it("applies correct margin percent for advanced tier", () => {
    const section = makeSection();
    const pkg = makePackage();

    const result = computeSectionEstimateBreakdown(section, pkg, "advanced");

    expect(result).not.toBeNull();
    expect(result!.breakdown.marginPercent).toBe(0.4);
  });

  it("applies correct margin percent for premium tier", () => {
    const section = makeSection();
    const pkg = makePackage();

    const result = computeSectionEstimateBreakdown(section, pkg, "premium");

    expect(result).not.toBeNull();
    expect(result!.breakdown.marginPercent).toBe(0.5);
  });

  it("includes deliverables from the selected tier", () => {
    const section = makeSection();
    const pkg = makePackage();

    const result = computeSectionEstimateBreakdown(section, pkg, "premium");

    expect(result).not.toBeNull();
    expect(result!.breakdown.deliverables).toEqual([
      "Premium deliverable set",
      "Full revision suite",
    ]);
    expect(result!.source.servicePackageName).toBe("Brand Launch");
    expect(result!.source.tierKey).toBe("premium");
  });

  it("falls back to category label deliverables when tier has none", () => {
    const section = makeSection();
    const pkg = makePackage({
      complexityTiers: [
        {
          id: "sp-1-standard",
          tier: "standard",
          title: "Standard",
          descriptor: "",
          deliverables: [],
          processNotes: [],
          timeGuidance: { minValue: 1, maxValue: 3, unit: "day" },
          variableDefaults: {
            quantity: 1,
            durationValue: null,
            durationUnit: null,
            resolution: "print",
            revisions: 1,
            urgency: "standard",
          },
          position: 1,
        },
      ],
    });

    const result = computeSectionEstimateBreakdown(section, pkg, "standard");

    expect(result).not.toBeNull();
    expect(result!.breakdown.deliverables).toEqual(["Print deliverable set"]);
  });

  it("handles missing tier gracefully by using first available tier", () => {
    const section = makeSection();
    const pkg = makePackage();

    const result = computeSectionEstimateBreakdown(
      section,
      pkg,
      "nonexistent-tier" as never,
    );

    expect(result).not.toBeNull();
    expect(result!.breakdown.estimatedHours).toEqual({ min: 8, max: 24 });
  });

  it("returns null when package has no complexity tiers", () => {
    const section = makeSection();
    const pkg = makePackage({ complexityTiers: [] });

    const result = computeSectionEstimateBreakdown(section, pkg);

    expect(result).toBeNull();
  });

  it("handles sections with zero line items gracefully", () => {
    const section = makeSection({ lineItems: [] });
    const pkg = makePackage();

    const result = computeSectionEstimateBreakdown(section, pkg, "standard");

    expect(result).not.toBeNull();
    expect(result!.breakdown.finalPriceCents).toBe(
      result!.breakdown.internalCostCents + result!.breakdown.marginCents,
    );
  });
});

describe("computeQuoteEstimateBreakdown", () => {
  it("aggregates section breakdowns into a grand total", () => {
    const section1 = makeSection();
    const section2 = makeSection({
      id: "qs-2",
      sourceServicePackageId: "sp-1",
      title: "Development",
      position: 2,
    });

    const pkg = makePackage();
    const packages = new Map([["sp-1", pkg]]);

    const result = computeQuoteEstimateBreakdown(
      [section1, section2],
      packages,
    );

    expect(result.sectionBreakdowns).toHaveLength(2);
    expect(result.grandTotal.estimatedHours.min).toBe(
      result.sectionBreakdowns.reduce(
        (sum, sb) => sum + sb.breakdown.estimatedHours.min,
        0,
      ),
    );
    expect(result.grandTotal.internalCostCents).toBe(
      result.sectionBreakdowns.reduce(
        (sum, sb) => sum + sb.breakdown.internalCostCents,
        0,
      ),
    );
    expect(result.grandTotal.finalPriceCents).toBe(
      result.sectionBreakdowns.reduce(
        (sum, sb) => sum + sb.breakdown.finalPriceCents,
        0,
      ),
    );
  });

  it("skips sections with no matching service package", () => {
    const section = makeSection();
    const packages = new Map<string, ServicePackageDetailRecord>();

    const result = computeQuoteEstimateBreakdown([section], packages);

    expect(result.sectionBreakdowns).toHaveLength(0);
    expect(result.grandTotal.internalCostCents).toBe(0);
  });

  it("aggregates role breakdowns by role name", () => {
    const section1 = makeSection();
    const section2 = makeSection({
      id: "qs-2",
      sourceServicePackageId: "sp-1",
      title: "Development",
      position: 2,
    });

    const pkg = makePackage();
    const packages = new Map([["sp-1", pkg]]);

    const result = computeQuoteEstimateBreakdown(
      [section1, section2],
      packages,
    );

    const roleNames = result.grandTotal.roleBreakdown.map((r) => r.role);
    const uniqueRoleNames = new Set(roleNames);
    expect(roleNames.length).toBe(uniqueRoleNames.size);
  });

  it("handles empty sections array", () => {
    const packages = new Map<string, ServicePackageDetailRecord>();

    const result = computeQuoteEstimateBreakdown([], packages);

    expect(result.sectionBreakdowns).toHaveLength(0);
    expect(result.grandTotal.estimatedHours).toEqual({ min: 0, max: 0 });
    expect(result.grandTotal.internalCostCents).toBe(0);
  });
});
