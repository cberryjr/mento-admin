import { randomUUID } from "node:crypto";

import type {
  ServicePackageInput,
  ServicePackageRecord,
} from "@/features/service-packages/types";

const SEEDED_SERVICE_PACKAGES: ServicePackageRecord[] = [
  {
    id: "package-brand-launch",
    studioId: "default-studio",
    name: "Brand Launch Package",
    category: "Branding",
    startingPriceLabel: "$2,400",
    shortDescription: "Launch-ready brand deliverables for a new client rollout.",
    createdAt: "2026-03-01T09:00:00.000Z",
    updatedAt: "2026-03-10T15:30:00.000Z",
  },
  {
    id: "package-content-sprint",
    studioId: "default-studio",
    name: "Content Sprint Package",
    category: "Content",
    startingPriceLabel: "$1,200",
    shortDescription: "Focused content production support for a campaign push.",
    createdAt: "2026-03-02T10:00:00.000Z",
    updatedAt: "2026-03-08T12:15:00.000Z",
  },
  {
    id: "package-other-studio",
    studioId: "other-studio",
    name: "Hidden Orchard Package",
    category: "Campaign",
    startingPriceLabel: "$1,900",
    shortDescription: "Other studio package used for authorization coverage.",
    createdAt: "2026-03-03T11:00:00.000Z",
    updatedAt: "2026-03-11T16:45:00.000Z",
  },
];

function createSeededStore() {
  return new Map(SEEDED_SERVICE_PACKAGES.map((servicePackage) => [servicePackage.id, servicePackage]));
}

type ServicePackagesStoreGlobal = typeof globalThis & {
  __mentoServicePackagesStore?: Map<string, ServicePackageRecord>;
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
  options?: { id?: string; existing?: ServicePackageRecord },
): ServicePackageRecord {
  const now = new Date().toISOString();

  return {
    id: options?.id ?? options?.existing?.id ?? randomUUID(),
    studioId,
    name: input.name,
    category: input.category,
    startingPriceLabel: input.startingPriceLabel,
    shortDescription: input.shortDescription,
    createdAt: options?.existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function readServicePackagesFromStore(studioId: string): ServicePackageRecord[] {
  return Array.from(getServicePackagesStore().values()).filter(
    (servicePackage) => servicePackage.studioId === studioId,
  );
}

export function readServicePackageFromStore(
  studioId: string,
  servicePackageId: string,
): ServicePackageRecord | null {
  const servicePackage = getServicePackagesStore().get(servicePackageId);
  if (!servicePackage || servicePackage.studioId !== studioId) {
    return null;
  }

  return servicePackage;
}

export function readServicePackageByIdFromStore(
  servicePackageId: string,
): ServicePackageRecord | null {
  return getServicePackagesStore().get(servicePackageId) ?? null;
}

export function createServicePackageInStore(
  studioId: string,
  input: ServicePackageInput,
): ServicePackageRecord {
  const record = toStoredServicePackage(studioId, input);
  getServicePackagesStore().set(record.id, record);
  return record;
}

export function updateServicePackageInStore(
  servicePackageId: string,
  input: ServicePackageInput,
): ServicePackageRecord | null {
  const existing = getServicePackagesStore().get(servicePackageId);

  if (!existing) {
    return null;
  }

  const updated = toStoredServicePackage(existing.studioId, input, { existing });
  getServicePackagesStore().set(servicePackageId, updated);
  return updated;
}

export function __resetServicePackagesStore() {
  (globalThis as ServicePackagesStoreGlobal).__mentoServicePackagesStore =
    createSeededStore();
}
