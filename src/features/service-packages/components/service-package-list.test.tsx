import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ServicePackageList } from "@/features/service-packages/components/service-package-list";
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

describe("ServicePackageList", () => {
  it("renders package identity fields, updated dates, and record count", () => {
    render(<ServicePackageList servicePackages={SERVICE_PACKAGES} />);

    expect(screen.getByText("2 service packages")).toBeVisible();
    expect(screen.getByRole("link", { name: /brand launch package/i })).toHaveAttribute(
      "href",
      "/service-packages/package-brand-launch?backTo=%2Fservice-packages",
    );
    expect(screen.getByText("Branding · Starts at $2,400")).toBeVisible();
    expect(screen.getByText(/launch-ready brand deliverables/i)).toBeVisible();
    expect(screen.getByText("Updated Mar 10, 2026")).toBeVisible();
    expect(screen.getByText("Updated Mar 8, 2026")).toBeVisible();
  });

  it("filters the list client-side across summary fields", () => {
    render(<ServicePackageList servicePackages={SERVICE_PACKAGES} />);

    const searchInput = screen.getByLabelText("Search service packages");

    fireEvent.change(searchInput, { target: { value: "content" } });
    expect(screen.queryByRole("link", { name: /brand launch package/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /content sprint package/i })).toBeVisible();

    fireEvent.change(searchInput, { target: { value: "$2,400" } });
    expect(screen.getByRole("link", { name: /brand launch package/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /content sprint package/i })).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "campaign push" } });
    expect(screen.getByRole("link", { name: /content sprint package/i })).toBeVisible();
  });

  it("preserves the active search context in record counts and reopen links", () => {
    render(
      <ServicePackageList
        servicePackages={SERVICE_PACKAGES}
        initialQuery="campaign push"
      />,
    );

    expect(screen.getByLabelText("Search service packages")).toHaveValue("campaign push");
    expect(screen.getByText("1 service package shown")).toBeVisible();
    expect(screen.getByText("Filtered from 2 service packages.")).toBeVisible();

    const href = screen
      .getByRole("link", { name: /content sprint package/i })
      .getAttribute("href");

    expect(href).toBeTruthy();
    expect(new URL(href!, "https://example.com").searchParams.get("backTo")).toBe(
      "/service-packages?search=campaign%20push",
    );
  });

  it("updates the visible filter state when initial query changes", () => {
    const { rerender } = render(
      <ServicePackageList
        servicePackages={SERVICE_PACKAGES}
        initialQuery="campaign push"
      />,
    );

    expect(screen.getByLabelText("Search service packages")).toHaveValue("campaign push");
    expect(screen.getByRole("link", { name: /content sprint package/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /brand launch package/i })).not.toBeInTheDocument();

    rerender(
      <ServicePackageList
        servicePackages={SERVICE_PACKAGES}
        initialQuery="brand"
      />,
    );

    expect(screen.getByLabelText("Search service packages")).toHaveValue("brand");
    expect(screen.getByRole("link", { name: /brand launch package/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /content sprint package/i })).not.toBeInTheDocument();
  });

  it("uses accessible labels and focus-visible styling for the search and result links", () => {
    render(<ServicePackageList servicePackages={SERVICE_PACKAGES} />);

    expect(screen.getByLabelText("Search service packages")).toBeVisible();
    expect(screen.getByLabelText("Search service packages")).toHaveClass("text-zinc-900");
    expect(screen.getByLabelText("Search service packages")).toHaveClass(
      "focus-visible:outline-zinc-900",
    );
    expect(screen.getByRole("link", { name: /brand launch package/i })).toHaveClass(
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-zinc-900",
    );
  });

  it("renders a distinct no-results state with a clear-filter action", () => {
    render(<ServicePackageList servicePackages={SERVICE_PACKAGES} />);

    fireEvent.change(screen.getByLabelText("Search service packages"), {
      target: { value: "non-matching term" },
    });

    expect(screen.getByText("No service packages match your search")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(screen.getByRole("link", { name: /brand launch package/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /content sprint package/i })).toBeVisible();
  });

  it("renders the shared empty state when no service packages exist", () => {
    render(<ServicePackageList servicePackages={[]} />);

    expect(screen.getByText("No service packages yet")).toBeVisible();
    expect(
      screen.getByText("Create a reusable package to speed up quote generation."),
    ).toBeVisible();
  });
});
