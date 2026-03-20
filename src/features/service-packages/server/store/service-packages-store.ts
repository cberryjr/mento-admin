import { randomUUID } from "node:crypto";

import {
  calculateServicePackageTotalCents,
  createDefaultComplexityTiers,
  formatServicePackageStartingPriceLabel,
  normalizeCatalogMetadata,
  normalizeComplexityTiers,
  type ServicePackageDetailRecord,
  type ServicePackageInput,
} from "@/features/service-packages/types";

const SEEDED_SERVICE_PACKAGES: ServicePackageDetailRecord[] = [
  {
    id: "package-brand-launch",
    studioId: "default-studio",
    name: "Brand Launch Package",
    categoryKey: "ai-print-campaigns",
    categoryLabel: "AI Print Campaigns",
    categoryShortLabel: "Print",
    category: "Branding",
    startingPriceLabel: "$2,400",
    shortDescription: "Launch-ready brand deliverables for a new client rollout.",
    packageTotalCents: 240000,
    complexityTiers: createDefaultComplexityTiers("ai-print-campaigns"),
    sections: [
      {
        id: "section-strategy",
        title: "Strategy",
        defaultContent: "Audience, positioning, and rollout alignment.",
        position: 1,
        lineItems: [
          {
            id: "line-item-workshop",
            sectionId: "section-strategy",
            name: "Discovery workshop",
            defaultContent: "Half-day alignment session with decision makers.",
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
            defaultContent: "Logo, palette, typography, and usage guidance.",
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
  },
  {
    id: "package-content-sprint",
    studioId: "default-studio",
    name: "Content Sprint Package",
    categoryKey: "social-media-animation",
    categoryLabel: "Social Media Animation",
    categoryShortLabel: "Social Animation",
    category: "Content",
    startingPriceLabel: "$1,200",
    shortDescription: "Focused content production support for a campaign push.",
    packageTotalCents: 120000,
    complexityTiers: createDefaultComplexityTiers("social-media-animation"),
    sections: [
      {
        id: "section-planning",
        title: "Planning",
        defaultContent: "Sprint planning and messaging alignment.",
        position: 1,
        lineItems: [
          {
            id: "line-item-brief",
            sectionId: "section-planning",
            name: "Content brief",
            defaultContent: "Sprint brief and production plan.",
            quantity: 1,
            unitLabel: "brief",
            unitPriceCents: 40000,
            position: 1,
          },
        ],
      },
      {
        id: "section-production",
        title: "Production",
        defaultContent: "Drafting and revision support.",
        position: 2,
        lineItems: [
          {
            id: "line-item-assets",
            sectionId: "section-production",
            name: "Content assets",
            defaultContent: "Three campaign-ready deliverables.",
            quantity: 1,
            unitLabel: "set",
            unitPriceCents: 80000,
            position: 1,
          },
        ],
      },
    ],
    createdAt: "2026-03-02T10:00:00.000Z",
    updatedAt: "2026-03-08T12:15:00.000Z",
  },
  {
    id: "package-other-studio",
    studioId: "other-studio",
    name: "Hidden Orchard Package",
    categoryKey: "ai-animation-ads",
    categoryLabel: "AI Animation Ads",
    categoryShortLabel: "Animation Ads",
    category: "Campaign",
    startingPriceLabel: "$1,900",
    shortDescription: "Other studio package used for authorization coverage.",
    packageTotalCents: 190000,
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
    createdAt: "2026-03-03T11:00:00.000Z",
    updatedAt: "2026-03-11T16:45:00.000Z",
  },
];

function cloneServicePackage<T>(value: T): T {
  return structuredClone(value);
}

function createSeededStore() {
  return new Map(
    SEEDED_SERVICE_PACKAGES.map((servicePackage) => [
      servicePackage.id,
      cloneServicePackage(servicePackage),
    ]),
  );
}

type ServicePackagesStoreGlobal = typeof globalThis & {
  __mentoServicePackagesStore?: Map<string, ServicePackageDetailRecord>;
};

function getServicePackagesStore() {
  const storeGlobal = globalThis as ServicePackagesStoreGlobal;

  if (!storeGlobal.__mentoServicePackagesStore) {
    storeGlobal.__mentoServicePackagesStore = createSeededStore();
  }

  return storeGlobal.__mentoServicePackagesStore;
}

function toStoredServicePackage(
  studioId: string,
  input: ServicePackageInput,
  options?: { id?: string; existing?: ServicePackageDetailRecord },
): ServicePackageDetailRecord {
  const now = new Date().toISOString();
  const packageTotalCents = calculateServicePackageTotalCents(input.sections);
  const catalog = normalizeCatalogMetadata(input);

  return {
    id: options?.id ?? options?.existing?.id ?? randomUUID(),
    studioId,
    name: input.name,
    categoryKey: catalog.categoryKey,
    categoryLabel: catalog.categoryLabel,
    categoryShortLabel: catalog.categoryShortLabel,
    category: catalog.category,
    startingPriceLabel: formatServicePackageStartingPriceLabel(packageTotalCents),
    shortDescription: input.shortDescription,
    packageTotalCents,
    complexityTiers: normalizeComplexityTiers(catalog.categoryKey, input.complexityTiers),
    sections: cloneServicePackage(input.sections),
    createdAt: options?.existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function readServicePackagesFromStore(studioId: string): ServicePackageDetailRecord[] {
  return Array.from(getServicePackagesStore().values())
    .filter((servicePackage) => servicePackage.studioId === studioId)
    .map((servicePackage) => {
      const catalog = normalizeCatalogMetadata(servicePackage);

      return cloneServicePackage({
        ...servicePackage,
        ...catalog,
        complexityTiers: normalizeComplexityTiers(
          catalog.categoryKey,
          servicePackage.complexityTiers,
        ),
      });
    });
}

export function readServicePackageFromStore(
  studioId: string,
  servicePackageId: string,
): ServicePackageDetailRecord | null {
  const servicePackage = getServicePackagesStore().get(servicePackageId);
  if (!servicePackage || servicePackage.studioId !== studioId) {
    return null;
  }

  const catalog = normalizeCatalogMetadata(servicePackage);

  return cloneServicePackage({
    ...servicePackage,
    ...catalog,
    complexityTiers: normalizeComplexityTiers(
      catalog.categoryKey,
      servicePackage.complexityTiers,
    ),
  });
}

export function readServicePackageByIdFromStore(
  servicePackageId: string,
): ServicePackageDetailRecord | null {
  const servicePackage = getServicePackagesStore().get(servicePackageId);

  if (!servicePackage) {
    return null;
  }

  const catalog = normalizeCatalogMetadata(servicePackage);

  return cloneServicePackage({
    ...servicePackage,
    ...catalog,
    complexityTiers: normalizeComplexityTiers(
      catalog.categoryKey,
      servicePackage.complexityTiers,
    ),
  });
}

export function createServicePackageInStore(
  studioId: string,
  input: ServicePackageInput,
): ServicePackageDetailRecord {
  const record = toStoredServicePackage(studioId, input);
  getServicePackagesStore().set(record.id, cloneServicePackage(record));
  return cloneServicePackage(record);
}

export function updateServicePackageInStore(
  studioId: string,
  servicePackageId: string,
  input: ServicePackageInput,
): ServicePackageDetailRecord | null {
  const existing = getServicePackagesStore().get(servicePackageId);

  if (!existing || existing.studioId !== studioId) {
    return null;
  }

  const updated = toStoredServicePackage(studioId, input, { existing });
  getServicePackagesStore().set(servicePackageId, cloneServicePackage(updated));
  return cloneServicePackage(updated);
}

export function __resetServicePackagesStore() {
  (globalThis as ServicePackagesStoreGlobal).__mentoServicePackagesStore =
    createSeededStore();
}
