import {
  COMPLEXITY_TIERS,
  SERVICE_CATEGORY_PROFILES,
  getServiceCategoryProfile,
  inferServiceCategoryKey,
  type ComplexityTierKey,
  type DurationUnit,
  type ResolutionOption,
  type ServiceCategoryKey,
  type UrgencyOption,
} from "@/features/service-packages/catalog-contract";

export type ServicePackageLineItemInput = {
  id: string;
  sectionId: string;
  name: string;
  defaultContent: string;
  quantity: number;
  unitLabel: string;
  unitPriceCents: number;
  position: number;
};

export type ServicePackageSectionInput = {
  id: string;
  title: string;
  defaultContent: string;
  position: number;
  lineItems: ServicePackageLineItemInput[];
};

export type ServicePackageInput = {
  name: string;
  categoryKey: ServiceCategoryKey;
  categoryLabel: string;
  categoryShortLabel: string;
  category: string;
  shortDescription: string;
  complexityTiers: ServicePackageComplexityTierInput[];
  sections: ServicePackageSectionInput[];
};

export type ServicePackageTimeGuidance = {
  minValue: number;
  maxValue: number;
  unit: DurationUnit;
};

export type ServicePackageVariableDefaults = {
  quantity: number;
  durationValue: number | null;
  durationUnit: DurationUnit | null;
  resolution: ResolutionOption | null;
  revisions: number;
  urgency: UrgencyOption;
};

export type ServicePackageComplexityTierInput = {
  id: string;
  tier: ComplexityTierKey;
  title: string;
  descriptor: string;
  deliverables: string[];
  processNotes: string[];
  timeGuidance: ServicePackageTimeGuidance;
  variableDefaults: ServicePackageVariableDefaults;
  position: number;
};

export type ServicePackageLineItemRecord = ServicePackageLineItemInput;

export type ServicePackageSectionRecord = Omit<ServicePackageSectionInput, "lineItems"> & {
  lineItems: ServicePackageLineItemRecord[];
};

export type ServicePackageRecord = {
  id: string;
  studioId: string;
  name: string;
  categoryKey: ServiceCategoryKey;
  categoryLabel: string;
  categoryShortLabel: string;
  category: string;
  startingPriceLabel: string;
  shortDescription: string;
  packageTotalCents: number;
  createdAt: string;
  updatedAt: string;
};

export type ServicePackageDetailRecord = ServicePackageRecord & {
  complexityTiers: ServicePackageComplexityTierInput[];
  sections: ServicePackageSectionRecord[];
};

export type ServicePackageSummary = {
  id: string;
  name: string;
  category: string;
  startingPriceLabel: string;
  shortDescription: string;
  updatedAt: string;
  packageTotalCents: number;
};

export function calculateLineItemTotalCents(
  lineItem: Pick<ServicePackageLineItemInput, "quantity" | "unitPriceCents">,
): number {
  return lineItem.quantity * lineItem.unitPriceCents;
}

export function calculateServicePackageTotalCents(
  sections: Array<Pick<ServicePackageSectionRecord, "lineItems">>,
): number {
  return sections.reduce((packageTotal, section) => {
    return (
      packageTotal +
      section.lineItems.reduce((sectionTotal, lineItem) => {
        return sectionTotal + calculateLineItemTotalCents(lineItem);
      }, 0)
    );
  }, 0);
}

export function formatServicePackageStartingPriceLabel(totalCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalCents / 100);
}

export function toServicePackageSummary(
  servicePackage: ServicePackageRecord | ServicePackageDetailRecord,
): ServicePackageSummary {
  return {
    id: servicePackage.id,
    name: servicePackage.name,
    category: servicePackage.category,
    startingPriceLabel: servicePackage.startingPriceLabel,
    shortDescription: servicePackage.shortDescription,
    updatedAt: servicePackage.updatedAt,
    packageTotalCents: servicePackage.packageTotalCents,
  };
}

function toTierLabel(tier: ComplexityTierKey): string {
  if (tier === "standard") {
    return "Standard";
  }

  if (tier === "advanced") {
    return "Advanced";
  }

  return "Premium";
}

function toTierDescriptor(tier: ComplexityTierKey): string {
  if (tier === "standard") {
    return "Fast production, lower complexity";
  }

  if (tier === "advanced") {
    return "High-quality commercial work";
  }

  return "Top-tier campaign production";
}

function toTierRangeMultiplier(tier: ComplexityTierKey): { min: number; max: number } {
  if (tier === "standard") {
    return { min: 0.5, max: 0.7 };
  }

  if (tier === "advanced") {
    return { min: 0.7, max: 0.9 };
  }

  return { min: 0.9, max: 1 };
}

function clampTimeValue(value: number) {
  return Math.max(1, Math.round(value));
}

export function createDefaultComplexityTiers(
  categoryKey: ServiceCategoryKey,
): ServicePackageComplexityTierInput[] {
  const profile = getServiceCategoryProfile(categoryKey);

  return COMPLEXITY_TIERS.map((tier, index) => {
    const multiplier = toTierRangeMultiplier(tier);
    const minValue = clampTimeValue(profile.baselineMin * multiplier.min);
    const maxValue = Math.max(minValue, clampTimeValue(profile.baselineMax * multiplier.max));

    return {
      id: `${profile.key}-${tier}`,
      tier,
      title: toTierLabel(tier),
      descriptor: toTierDescriptor(tier),
      deliverables: [
        `${profile.shortLabel} deliverable set`,
      ],
      processNotes: [
        "Prompt design and AI generation",
        "Review and finishing pass",
      ],
      timeGuidance: {
        minValue,
        maxValue,
        unit: profile.baselineUnit,
      },
      variableDefaults: {
        quantity: 1,
        durationValue: null,
        durationUnit: null,
        resolution: profile.defaultResolution,
        revisions: tier === "premium" ? 3 : tier === "advanced" ? 2 : 1,
        urgency: "standard",
      },
      position: index + 1,
    };
  });
}

export function normalizeComplexityTiers(
  categoryKey: ServiceCategoryKey,
  tiers: ServicePackageComplexityTierInput[] | null | undefined,
): ServicePackageComplexityTierInput[] {
  if (!tiers || tiers.length === 0) {
    return createDefaultComplexityTiers(categoryKey);
  }

  const defaults = createDefaultComplexityTiers(categoryKey);
  const tierByKey = new Map(tiers.map((tier) => [tier.tier, tier]));

  return COMPLEXITY_TIERS.map((tierKey, index) => {
    const fallback = defaults[index];
    const source = tierByKey.get(tierKey);

    if (!source) {
      return fallback;
    }

    return {
      ...source,
      tier: tierKey,
      id: source.id || fallback.id,
      title: source.title || fallback.title,
      descriptor: source.descriptor || fallback.descriptor,
      deliverables:
        source.deliverables.length > 0
          ? source.deliverables
          : fallback.deliverables,
      processNotes:
        source.processNotes.length > 0
          ? source.processNotes
          : fallback.processNotes,
      variableDefaults: {
        ...fallback.variableDefaults,
        ...source.variableDefaults,
      },
      timeGuidance: {
        ...fallback.timeGuidance,
        ...source.timeGuidance,
      },
      position: index + 1,
    };
  });
}

export function normalizeCatalogMetadata(input: {
  categoryKey?: string | null;
  categoryLabel?: string | null;
  categoryShortLabel?: string | null;
  category?: string | null;
}) {
  const validCategoryKeys = new Set<ServiceCategoryKey>(
    SERVICE_CATEGORY_PROFILES.map((profile) => profile.key),
  );

  const inferredKey =
    input.categoryKey &&
    validCategoryKeys.has(input.categoryKey as ServiceCategoryKey)
      ? (input.categoryKey as ServiceCategoryKey)
      : inferServiceCategoryKey(input.categoryLabel ?? input.category);
  const profile = getServiceCategoryProfile(inferredKey);

  return {
    categoryKey: inferredKey,
    categoryLabel: profile.label,
    categoryShortLabel: profile.shortLabel,
    category: profile.label,
  };
}
