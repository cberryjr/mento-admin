import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { EstimateBreakdownPanel } from "@/features/quotes/components/estimate-breakdown-panel";
import type { EstimateBreakdownPayload } from "@/features/quotes/types";

afterEach(() => {
  cleanup();
});

function makeBreakdown(
  overrides: Partial<EstimateBreakdownPayload> = {},
): EstimateBreakdownPayload {
  return {
    quoteId: "q-1",
    computedAt: "2026-03-21T12:00:00.000Z",
    sectionBreakdowns: [
      {
        sectionId: "qs-1",
        sectionTitle: "Design",
        source: {
          servicePackageId: "sp-1",
          servicePackageName: "Brand Launch",
          categoryLabel: "AI Print Campaigns",
          tierKey: "standard",
          tierTitle: "Standard",
          tierDescriptor: "Fast production",
          timeGuidance: { minValue: 1, maxValue: 3, unit: "day" },
          variableDefaults: {
            quantity: 1,
            durationValue: null,
            durationUnit: null,
            resolution: "print",
            revisions: 1,
            urgency: "standard",
          },
        },
        breakdown: {
          estimatedHours: { min: 8, max: 24 },
          roleBreakdown: [
            { role: "Creative Director", hours: 4.8, hourlyRateCents: 15000, costCents: 72000 },
            { role: "AI Artist", hours: 17.6, hourlyRateCents: 8000, costCents: 140800 },
          ],
          internalCostCents: 212800,
          marginPercent: 0.3,
          marginCents: 63840,
          finalPriceCents: 50000,
          deliverables: ["Print deliverable set"],
        },
      },
    ],
    grandTotal: {
      estimatedHours: { min: 8, max: 24 },
      roleBreakdown: [
        { role: "Creative Director", hours: 4.8, hourlyRateCents: 15000, costCents: 72000 },
        { role: "AI Artist", hours: 17.6, hourlyRateCents: 8000, costCents: 140800 },
      ],
      internalCostCents: 212800,
      marginPercent: 0.3,
      marginCents: 63840,
      finalPriceCents: 50000,
      deliverables: ["Print deliverable set"],
    },
    ...overrides,
  };
}

describe("EstimateBreakdownPanel", () => {
  it("renders without crashing and shows heading", () => {
    const breakdown = makeBreakdown();
    render(<EstimateBreakdownPanel breakdown={breakdown} />);

    expect(screen.getByText("Estimate breakdown")).toBeInTheDocument();
    expect(screen.getByText("Derived from service package complexity tiers")).toBeInTheDocument();
  });

  it("renders a table for role breakdown", () => {
    const breakdown = makeBreakdown();
    render(<EstimateBreakdownPanel breakdown={breakdown} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("shows empty state for empty breakdown", () => {
    const breakdown = makeBreakdown({
      sectionBreakdowns: [],
      grandTotal: {
        estimatedHours: { min: 0, max: 0 },
        roleBreakdown: [],
        internalCostCents: 0,
        marginPercent: 0,
        marginCents: 0,
        finalPriceCents: 0,
        deliverables: [],
      },
    });
    render(<EstimateBreakdownPanel breakdown={breakdown} />);

    expect(screen.getByText(/No estimate breakdown available/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("is expanded by default and shows section content", () => {
    const breakdown = makeBreakdown();
    render(<EstimateBreakdownPanel breakdown={breakdown} />);

    const toggle = screen.getByRole("button");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveTextContent("Collapse");
  });

  it("collapses and expands on button click", () => {
    const breakdown = makeBreakdown();
    render(<EstimateBreakdownPanel breakdown={breakdown} />);

    const toggle = screen.getByRole("button");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveTextContent("Expand details");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveTextContent("Collapse");
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("starts collapsed in preview mode", () => {
    const breakdown = makeBreakdown();
    render(<EstimateBreakdownPanel breakdown={breakdown} isPreview />);

    const toggle = screen.getByRole("button");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveTextContent("Expand details");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders deliverables when expanded", () => {
    const breakdown = makeBreakdown();
    render(<EstimateBreakdownPanel breakdown={breakdown} />);

    expect(screen.getByText("Deliverables")).toBeInTheDocument();
    expect(screen.getByText("Print deliverable set")).toBeInTheDocument();
  });

  it("renders source package and tier provenance", () => {
    const breakdown = makeBreakdown();
    render(<EstimateBreakdownPanel breakdown={breakdown} />);

    expect(
      screen.getByText(/Source: Brand Launch · Standard tier · 1-3 day/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Inputs: Qty 1 • Resolution PRINT • Revisions 1 • Urgency standard/i),
    ).toBeInTheDocument();
  });

  it("renders summary grid labels", () => {
    const breakdown = makeBreakdown();
    render(<EstimateBreakdownPanel breakdown={breakdown} />);

    expect(screen.getByText("Est. hours")).toBeInTheDocument();
    expect(screen.getAllByText("Internal cost").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Margin")).toBeInTheDocument();
    expect(screen.getAllByText("Final price").length).toBeGreaterThanOrEqual(1);
  });
});
