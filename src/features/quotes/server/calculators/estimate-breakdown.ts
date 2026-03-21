import type {
  EstimateBreakdown,
  QuoteSectionRecord,
  RoleBreakdownEntry,
  SectionEstimateBreakdown,
} from "@/features/quotes/types";
import type { ServicePackageDetailRecord } from "@/features/service-packages/types";
import type { ComplexityTierKey, ServiceCategoryKey } from "@/features/service-packages/catalog-contract";

type RoleDefinition = {
  role: string;
  hourlyRateCents: number;
};

type CategoryRoleAllocation = {
  [K in ServiceCategoryKey]?: Array<{ role: string; weight: number }>;
};

const ROLE_DEFINITIONS: RoleDefinition[] = [
  { role: "Creative Director", hourlyRateCents: 15000 },
  { role: "AI Artist", hourlyRateCents: 8000 },
  { role: "CGI Artist", hourlyRateCents: 10000 },
  { role: "Motion Designer", hourlyRateCents: 9000 },
  { role: "Illustrator", hourlyRateCents: 8500 },
  { role: "Editor/Compositor", hourlyRateCents: 7500 },
];

const ROLE_RATE_BY_NAME = new Map(
  ROLE_DEFINITIONS.map((r) => [r.role, r.hourlyRateCents]),
);

const CATEGORY_ROLE_ALLOCATIONS: CategoryRoleAllocation = {
  "ai-print-campaigns": [
    { role: "Creative Director", weight: 0.15 },
    { role: "AI Artist", weight: 0.55 },
    { role: "Editor/Compositor", weight: 0.3 },
  ],
  "ai-product-shoot": [
    { role: "Creative Director", weight: 0.15 },
    { role: "AI Artist", weight: 0.45 },
    { role: "CGI Artist", weight: 0.25 },
    { role: "Editor/Compositor", weight: 0.15 },
  ],
  "ai-concept-art": [
    { role: "Creative Director", weight: 0.1 },
    { role: "AI Artist", weight: 0.6 },
    { role: "Illustrator", weight: 0.3 },
  ],
  "ai-character-design": [
    { role: "Creative Director", weight: 0.1 },
    { role: "AI Artist", weight: 0.5 },
    { role: "Illustrator", weight: 0.4 },
  ],
  "ai-animation-ads": [
    { role: "Creative Director", weight: 0.1 },
    { role: "AI Artist", weight: 0.25 },
    { role: "Motion Designer", weight: 0.4 },
    { role: "Editor/Compositor", weight: 0.25 },
  ],
  cineminuto: [
    { role: "Creative Director", weight: 0.1 },
    { role: "AI Artist", weight: 0.2 },
    { role: "Motion Designer", weight: 0.35 },
    { role: "Editor/Compositor", weight: 0.35 },
  ],
  "social-media-animation": [
    { role: "Creative Director", weight: 0.1 },
    { role: "AI Artist", weight: 0.3 },
    { role: "Motion Designer", weight: 0.35 },
    { role: "Editor/Compositor", weight: 0.25 },
  ],
};

const TIER_MARGIN_PERCENTS: Record<ComplexityTierKey, number> = {
  standard: 0.3,
  advanced: 0.4,
  premium: 0.5,
};

function getHourlyRateCents(roleName: string): number {
  return ROLE_RATE_BY_NAME.get(roleName) ?? 8000;
}

function computeTierEstimatedHours(
  timeMin: number,
  timeMax: number,
  timeUnit: string,
): { min: number; max: number } {
  if (timeUnit === "week") {
    return { min: timeMin * 40, max: timeMax * 40 };
  }

  return { min: timeMin * 8, max: timeMax * 8 };
}

function computeRoleBreakdown(
  totalHours: number,
  categoryKey: ServiceCategoryKey,
): RoleBreakdownEntry[] {
  const allocations =
    CATEGORY_ROLE_ALLOCATIONS[categoryKey] ??
    CATEGORY_ROLE_ALLOCATIONS["ai-print-campaigns"]!;

  return allocations.map((alloc) => {
    const hours = Math.round(totalHours * alloc.weight * 100) / 100;
    const hourlyRateCents = getHourlyRateCents(alloc.role);
    const costCents = Math.round(hours * hourlyRateCents);

    return {
      role: alloc.role,
      hours,
      hourlyRateCents,
      costCents,
    };
  });
}

function findTierKey(
  tiers: ServicePackageDetailRecord["complexityTiers"],
  sourceTierKey?: string,
): ComplexityTierKey {
  if (sourceTierKey) {
    const match = tiers.find((t) => t.tier === sourceTierKey);
    if (match) return match.tier;
  }

  const first = tiers[0];
  return first?.tier ?? "standard";
}

export function getDefaultEstimateTierKey(
  tiers: ServicePackageDetailRecord["complexityTiers"],
): ComplexityTierKey {
  return findTierKey(tiers);
}

function selectTier(
  tiers: ServicePackageDetailRecord["complexityTiers"],
  sourceTierKey?: string,
) {
  const key = findTierKey(tiers, sourceTierKey);
  return tiers.find((t) => t.tier === key) ?? tiers[0] ?? null;
}

export function computeSectionEstimateBreakdown(
  section: QuoteSectionRecord,
  sourcePackage: ServicePackageDetailRecord,
  sourceTierKey?: string,
): SectionEstimateBreakdown | null {
  const tier = selectTier(sourcePackage.complexityTiers, sourceTierKey);

  if (!tier) {
    return null;
  }

  const estimatedHours = computeTierEstimatedHours(
    tier.timeGuidance.minValue,
    tier.timeGuidance.maxValue,
    tier.timeGuidance.unit,
  );

  const midpointHours = (estimatedHours.min + estimatedHours.max) / 2;
  const roleBreakdown = computeRoleBreakdown(midpointHours, sourcePackage.categoryKey);

  const internalCostCents = roleBreakdown.reduce(
    (sum, r) => sum + r.costCents,
    0,
  );

  const sectionSubtotalCents = section.lineItems.reduce(
    (sum, li) => sum + li.lineTotalCents,
    0,
  );

  const marginPercent = TIER_MARGIN_PERCENTS[tier.tier] ?? 0.35;
  const marginCents = Math.round(internalCostCents * marginPercent);
  const finalPriceCents =
    sectionSubtotalCents > 0
      ? sectionSubtotalCents
      : internalCostCents + marginCents;

  const deliverables = tier.deliverables.length > 0
    ? tier.deliverables
    : [`${sourcePackage.categoryShortLabel} deliverable set`];

  const breakdown: EstimateBreakdown = {
    estimatedHours,
    roleBreakdown,
    internalCostCents,
    marginPercent,
    marginCents,
    finalPriceCents,
    deliverables,
  };

  return {
    sectionId: section.id,
    sectionTitle: section.title,
    source: {
      servicePackageId: sourcePackage.id,
      servicePackageName: sourcePackage.name,
      categoryLabel: sourcePackage.categoryLabel,
      tierKey: tier.tier,
      tierTitle: tier.title,
      tierDescriptor: tier.descriptor,
      timeGuidance: {
        minValue: tier.timeGuidance.minValue,
        maxValue: tier.timeGuidance.maxValue,
        unit: tier.timeGuidance.unit,
      },
      variableDefaults: {
        quantity: tier.variableDefaults.quantity,
        durationValue: tier.variableDefaults.durationValue,
        durationUnit: tier.variableDefaults.durationUnit,
        resolution: tier.variableDefaults.resolution,
        revisions: tier.variableDefaults.revisions,
        urgency: tier.variableDefaults.urgency,
      },
    },
    breakdown,
  };
}

export function computeQuoteEstimateBreakdown(
  sections: QuoteSectionRecord[],
  servicePackages: Map<string, ServicePackageDetailRecord>,
  sourceTierKeys: Map<string, string> = new Map(),
): {
  sectionBreakdowns: SectionEstimateBreakdown[];
  grandTotal: EstimateBreakdown;
} {
  const sectionBreakdowns: SectionEstimateBreakdown[] = [];

  for (const section of sections) {
    const sourcePackage = servicePackages.get(section.sourceServicePackageId);

    if (!sourcePackage) {
      continue;
    }

    const tierKey = sourceTierKeys.get(section.id);
    const result = computeSectionEstimateBreakdown(
      section,
      sourcePackage,
      tierKey,
    );

    if (result) {
      sectionBreakdowns.push(result);
    }
  }

  const grandTotal: EstimateBreakdown = {
    estimatedHours: {
      min: sectionBreakdowns.reduce(
        (sum, sb) => sum + sb.breakdown.estimatedHours.min,
        0,
      ),
      max: sectionBreakdowns.reduce(
        (sum, sb) => sum + sb.breakdown.estimatedHours.max,
        0,
      ),
    },
    roleBreakdown: aggregateRoleBreakdowns(
      sectionBreakdowns.map((sb) => sb.breakdown.roleBreakdown),
    ),
    internalCostCents: sectionBreakdowns.reduce(
      (sum, sb) => sum + sb.breakdown.internalCostCents,
      0,
    ),
    marginPercent:
      sectionBreakdowns.length > 0
        ? sectionBreakdowns.reduce(
            (sum, sb) => sum + sb.breakdown.marginPercent,
            0,
          ) / sectionBreakdowns.length
        : 0,
    marginCents: sectionBreakdowns.reduce(
      (sum, sb) => sum + sb.breakdown.marginCents,
      0,
    ),
    finalPriceCents: sectionBreakdowns.reduce(
      (sum, sb) => sum + sb.breakdown.finalPriceCents,
      0,
    ),
    deliverables: sectionBreakdowns.flatMap((sb) => sb.breakdown.deliverables),
  };

  return { sectionBreakdowns, grandTotal };
}

function aggregateRoleBreakdowns(
  roleBreakdowns: RoleBreakdownEntry[][],
): RoleBreakdownEntry[] {
  const byRole = new Map<string, RoleBreakdownEntry>();

  for (const breakdown of roleBreakdowns) {
    for (const entry of breakdown) {
      const existing = byRole.get(entry.role);

      if (existing) {
        existing.hours = Math.round((existing.hours + entry.hours) * 100) / 100;
        existing.costCents += entry.costCents;
      } else {
        byRole.set(entry.role, { ...entry });
      }
    }
  }

  return Array.from(byRole.values());
}
