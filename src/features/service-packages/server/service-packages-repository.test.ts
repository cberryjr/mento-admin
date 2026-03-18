import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetServicePackagesStore,
  createServicePackageRecord,
  getServicePackageById,
  listServicePackagesForStudio,
  updateServicePackageRecord,
} from "@/features/service-packages/server/service-packages-repository";

describe("servicePackagesRepository", () => {
  beforeEach(() => {
    __resetServicePackagesStore();
  });

  it("lists only studio-scoped service packages in a stable alphabetical order", async () => {
    const packages = await listServicePackagesForStudio("default-studio");

    expect(packages.map((servicePackage) => servicePackage.name)).toEqual([
      "Brand Launch Package",
      "Content Sprint Package",
    ]);
  });

  it("creates a service package record that can be loaded again", async () => {
    const created = await createServicePackageRecord("default-studio", {
      name: "Website Refresh Package",
      category: "Web",
      startingPriceLabel: "$3,200",
      shortDescription: "Refresh a marketing site for relaunch.",
    });

    const loaded = await getServicePackageById(created.id);

    expect(loaded).toMatchObject({
      studioId: "default-studio",
      name: "Website Refresh Package",
      category: "Web",
      startingPriceLabel: "$3,200",
      shortDescription: "Refresh a marketing site for relaunch.",
    });
  });

  it("updates an existing service package without changing its original created timestamp", async () => {
    const existing = await getServicePackageById("package-brand-launch");

    expect(existing).not.toBeNull();

    const updated = await updateServicePackageRecord(
      "default-studio",
      "package-brand-launch",
      {
        name: "Brand Launch Package",
        category: "Brand Strategy",
        startingPriceLabel: "$2,750",
        shortDescription: "Updated launch support summary.",
      },
    );

    expect(updated).toMatchObject({
      id: "package-brand-launch",
      category: "Brand Strategy",
      startingPriceLabel: "$2,750",
      shortDescription: "Updated launch support summary.",
    });
    expect(updated?.createdAt).toBe(existing?.createdAt);
    expect(updated?.updatedAt).not.toBe(existing?.updatedAt);
  });
});
