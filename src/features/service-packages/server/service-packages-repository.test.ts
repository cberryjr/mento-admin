import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultComplexityTiers } from "@/features/service-packages/types";

import {
  __resetServicePackagesStore,
  createServicePackageRecord,
  getServicePackageById,
  listServicePackagesForStudio,
  updateServicePackageRecord,
} from "@/features/service-packages/server/service-packages-repository";

function buildStructuredInput() {
  return {
    name: "Website Refresh Package",
    categoryKey: "ai-print-campaigns" as const,
    categoryLabel: "AI Print Campaigns",
    categoryShortLabel: "Print",
    category: "Web",
    shortDescription: "Refresh a marketing site for relaunch.",
    complexityTiers: createDefaultComplexityTiers("ai-print-campaigns"),
    sections: [
      {
        id: "section-discovery",
        title: "Discovery",
        defaultContent: "Audit and project kickoff.",
        position: 1,
        lineItems: [
          {
            id: "line-item-audit",
            sectionId: "section-discovery",
            name: "Site audit",
            defaultContent: "Audit current pages and conversion gaps.",
            quantity: 1,
            unitLabel: "audit",
            unitPriceCents: 75000,
            position: 1,
          },
        ],
      },
      {
        id: "section-delivery",
        title: "Delivery",
        defaultContent: "Design and implementation support.",
        position: 2,
        lineItems: [
          {
            id: "line-item-pages",
            sectionId: "section-delivery",
            name: "Page redesign",
            defaultContent: "Refresh homepage and sales page.",
            quantity: 2,
            unitLabel: "page",
            unitPriceCents: 125000,
            position: 1,
          },
        ],
      },
    ],
  };
}

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
    expect(packages[0].categoryKey).toBe("ai-print-campaigns");
    expect(packages[0].packageTotalCents).toBe(240000);
  });

  it("creates a structured service package record that can be loaded again", async () => {
    const created = await createServicePackageRecord("default-studio", buildStructuredInput());

    const loaded = await getServicePackageById(created.id);

    expect(loaded).toMatchObject({
      studioId: "default-studio",
      name: "Website Refresh Package",
      category: "AI Print Campaigns",
      startingPriceLabel: "$3,250",
      shortDescription: "Refresh a marketing site for relaunch.",
      packageTotalCents: 325000,
    });
    expect(loaded?.categoryKey).toBe("ai-print-campaigns");
    expect(loaded?.complexityTiers).toHaveLength(3);
    expect(loaded?.sections).toHaveLength(2);
    expect(loaded?.sections[1].lineItems[0]).toMatchObject({
      name: "Page redesign",
      quantity: 2,
      unitPriceCents: 125000,
    });
  });

  it("updates a structured package without corrupting sibling content or createdAt", async () => {
    const existing = await getServicePackageById("package-brand-launch");

    expect(existing).not.toBeNull();

    const updated = await updateServicePackageRecord(
      "default-studio",
      "package-brand-launch",
      {
        name: "Brand Launch Package",
        categoryKey: "ai-print-campaigns",
        categoryLabel: "AI Print Campaigns",
        categoryShortLabel: "Print",
        category: "Brand Strategy",
        shortDescription: "Updated launch support summary.",
        complexityTiers: createDefaultComplexityTiers("ai-print-campaigns"),
        sections: [
          {
            id: "section-strategy",
            title: "Strategy",
            defaultContent: "Audience and positioning updates.",
            position: 1,
            lineItems: [
              {
                id: "line-item-workshop",
                sectionId: "section-strategy",
                name: "Discovery workshop",
                defaultContent: "Updated discovery session.",
                quantity: 1,
                unitLabel: "session",
                unitPriceCents: 140000,
                position: 1,
              },
            ],
          },
          {
            id: "section-delivery",
            title: "Delivery",
            defaultContent: "Updated delivery scope.",
            position: 2,
            lineItems: [
              {
                id: "line-item-identity",
                sectionId: "section-delivery",
                name: "Brand identity system",
                defaultContent: "Refined identity package.",
                quantity: 1,
                unitLabel: "package",
                unitPriceCents: 110000,
                position: 1,
              },
              {
                id: "line-item-rollout",
                sectionId: "section-delivery",
                name: "Rollout guidance",
                defaultContent: "Launch checklist and handoff.",
                quantity: 1,
                unitLabel: "guide",
                unitPriceCents: 30000,
                position: 2,
              },
            ],
          },
        ],
      },
    );

    expect(updated).toMatchObject({
      id: "package-brand-launch",
      category: "AI Print Campaigns",
      startingPriceLabel: "$2,800",
      shortDescription: "Updated launch support summary.",
      packageTotalCents: 280000,
    });
    expect(updated?.sections[1].lineItems).toHaveLength(2);
    expect(updated?.sections[1].lineItems[0].name).toBe("Brand identity system");
    expect(updated?.createdAt).toBe(existing?.createdAt);
    expect(updated?.updatedAt).not.toBe(existing?.updatedAt);
  });
});
