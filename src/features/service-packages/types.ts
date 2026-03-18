export type ServicePackageInput = {
  name: string;
  category: string;
  startingPriceLabel: string;
  shortDescription: string;
};

export type ServicePackageRecord = ServicePackageInput & {
  id: string;
  studioId: string;
  createdAt: string;
  updatedAt: string;
};

export type ServicePackageSummary = {
  id: string;
  name: string;
  category: string;
  startingPriceLabel: string;
  shortDescription: string;
  updatedAt: string;
};

export function toServicePackageSummary(
  servicePackage: ServicePackageRecord,
): ServicePackageSummary {
  return {
    id: servicePackage.id,
    name: servicePackage.name,
    category: servicePackage.category,
    startingPriceLabel: servicePackage.startingPriceLabel,
    shortDescription: servicePackage.shortDescription,
    updatedAt: servicePackage.updatedAt,
  };
}
