export type ServicePackageSummary = {
  id: string;
  name: string;
  category: string;
  startingPriceLabel: string;
};

export const servicePackageFixtures: ServicePackageSummary[] = [
  {
    id: "package-brand-launch",
    name: "Brand Launch Package",
    category: "Branding",
    startingPriceLabel: "$2,400",
  },
  {
    id: "package-content-sprint",
    name: "Content Sprint Package",
    category: "Content",
    startingPriceLabel: "$1,200",
  },
];
