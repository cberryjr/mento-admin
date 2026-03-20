export const SERVICE_CATEGORY_PROFILES = [
  {
    key: "ai-print-campaigns",
    label: "AI Print Campaigns",
    shortLabel: "Print",
    baselineUnit: "day",
    baselineMin: 2,
    baselineMax: 10,
    defaultResolution: "print",
  },
  {
    key: "ai-product-shoot",
    label: "AI Product Shoot",
    shortLabel: "Product",
    baselineUnit: "day",
    baselineMin: 1,
    baselineMax: 8,
    defaultResolution: "4k",
  },
  {
    key: "ai-concept-art",
    label: "AI Concept Art",
    shortLabel: "Concept Art",
    baselineUnit: "day",
    baselineMin: 1,
    baselineMax: 7,
    defaultResolution: "hd",
  },
  {
    key: "ai-character-design",
    label: "AI Character Design",
    shortLabel: "Character",
    baselineUnit: "day",
    baselineMin: 2,
    baselineMax: 10,
    defaultResolution: "hd",
  },
  {
    key: "ai-animation-ads",
    label: "AI Animation Ads",
    shortLabel: "Animation Ads",
    baselineUnit: "day",
    baselineMin: 4,
    baselineMax: 21,
    defaultResolution: "4k",
  },
  {
    key: "cineminuto",
    label: "Cineminuto",
    shortLabel: "Cineminuto",
    baselineUnit: "week",
    baselineMin: 2,
    baselineMax: 7,
    defaultResolution: "4k",
  },
  {
    key: "social-media-animation",
    label: "Social Media Animation",
    shortLabel: "Social Animation",
    baselineUnit: "day",
    baselineMin: 2,
    baselineMax: 10,
    defaultResolution: "hd",
  },
] as const;

export const COMPLEXITY_TIERS = ["standard", "advanced", "premium"] as const;
export const RESOLUTION_OPTIONS = ["hd", "4k", "print"] as const;
export const URGENCY_OPTIONS = ["standard", "rush"] as const;
export const DURATION_UNITS = ["day", "week"] as const;

export type ServiceCategoryKey = (typeof SERVICE_CATEGORY_PROFILES)[number]["key"];
export type ComplexityTierKey = (typeof COMPLEXITY_TIERS)[number];
export type ResolutionOption = (typeof RESOLUTION_OPTIONS)[number];
export type UrgencyOption = (typeof URGENCY_OPTIONS)[number];
export type DurationUnit = (typeof DURATION_UNITS)[number];

export type ServiceCategoryProfile = (typeof SERVICE_CATEGORY_PROFILES)[number];

const CATEGORY_BY_KEY = new Map(SERVICE_CATEGORY_PROFILES.map((profile) => [profile.key, profile]));

export function getServiceCategoryProfile(categoryKey: ServiceCategoryKey): ServiceCategoryProfile {
  return CATEGORY_BY_KEY.get(categoryKey) ?? SERVICE_CATEGORY_PROFILES[0];
}

export function inferServiceCategoryKey(value: string | null | undefined): ServiceCategoryKey {
  const normalized = (value ?? "").trim().toLowerCase();

  if (normalized.includes("product")) {
    return "ai-product-shoot";
  }

  if (normalized.includes("concept")) {
    return "ai-concept-art";
  }

  if (normalized.includes("character")) {
    return "ai-character-design";
  }

  if (normalized.includes("cineminuto")) {
    return "cineminuto";
  }

  if (normalized.includes("social") || normalized.includes("content")) {
    return "social-media-animation";
  }

  if (normalized.includes("animation")) {
    return "ai-animation-ads";
  }

  if (normalized.includes("campaign") || normalized.includes("brand") || normalized.includes("print")) {
    return "ai-print-campaigns";
  }

  return "ai-print-campaigns";
}
