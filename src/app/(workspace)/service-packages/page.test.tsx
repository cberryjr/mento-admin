import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/service-packages/server/queries/list-service-packages", () => ({
  listServicePackages: vi.fn(),
}));

import ServicePackagesPage from "@/app/(workspace)/service-packages/page";
import { listServicePackages } from "@/features/service-packages/server/queries/list-service-packages";
import type { ServicePackageSummary } from "@/features/service-packages/types";

afterEach(() => {
  cleanup();
});

const SERVICE_PACKAGES: ServicePackageSummary[] = [
  {
    id: "package-brand-launch",
    name: "Brand Launch Package",
    category: "Branding",
    startingPriceLabel: "$2,400",
    shortDescription: "Launch-ready brand deliverables for a new client rollout.",
    updatedAt: "2026-03-10T15:30:00.000Z",
    packageTotalCents: 240000,
  },
  {
    id: "package-content-sprint",
    name: "Content Sprint Package",
    category: "Content",
    startingPriceLabel: "$1,200",
    shortDescription: "Focused content production support for a campaign push.",
    updatedAt: "2026-03-08T12:15:00.000Z",
    packageTotalCents: 120000,
  },
];

describe("ServicePackagesPage", () => {
  beforeEach(() => {
    vi.mocked(listServicePackages).mockResolvedValue({
      ok: true,
      data: {
        servicePackages: SERVICE_PACKAGES,
      },
      meta: {
        total: SERVICE_PACKAGES.length,
      },
    });
  });

  it("hydrates the list search from the incoming page search params", async () => {
    const ui = await ServicePackagesPage({
      searchParams: Promise.resolve({ search: "campaign push" }),
    });

    render(ui);

    expect(screen.getByLabelText("Search service packages")).toHaveValue("campaign push");
    expect(screen.getByText("1 service package shown")).toBeVisible();
    expect(screen.getByText("Filtered from 2 service packages.")).toBeVisible();
  });

  it("renders a single create CTA when the library is empty", async () => {
    vi.mocked(listServicePackages).mockResolvedValue({
      ok: true,
      data: {
        servicePackages: [],
      },
      meta: {
        total: 0,
      },
    });

    const ui = await ServicePackagesPage();
    render(ui);

    expect(screen.getAllByRole("link", { name: "Create service package" })).toHaveLength(1);
  });

  it("renders an inline error alert when the service package query fails", async () => {
    vi.mocked(listServicePackages).mockResolvedValue({
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Could not load service packages.",
      },
    });

    const ui = await ServicePackagesPage();
    render(ui);

    expect(screen.getByText("Could not load service packages")).toBeVisible();
    expect(screen.getByText("Refresh the page and try again.")).toBeVisible();
  });
});
