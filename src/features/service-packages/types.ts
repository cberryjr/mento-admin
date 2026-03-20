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
  category: string;
  shortDescription: string;
  sections: ServicePackageSectionInput[];
};

export type ServicePackageLineItemRecord = ServicePackageLineItemInput;

export type ServicePackageSectionRecord = Omit<ServicePackageSectionInput, "lineItems"> & {
  lineItems: ServicePackageLineItemRecord[];
};

export type ServicePackageRecord = {
  id: string;
  studioId: string;
  name: string;
  category: string;
  startingPriceLabel: string;
  shortDescription: string;
  packageTotalCents: number;
  createdAt: string;
  updatedAt: string;
};

export type ServicePackageDetailRecord = ServicePackageRecord & {
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
