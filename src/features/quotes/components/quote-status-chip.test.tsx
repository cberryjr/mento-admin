import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { QuoteStatusChip } from "@/features/quotes/components/quote-status-chip";

afterEach(() => {
  cleanup();
});

describe("QuoteStatusChip", () => {
  it("renders draft status with blue styling", () => {
    render(<QuoteStatusChip status="draft" />);

    const chip = screen.getByLabelText("Quote status: draft");
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass("bg-blue-100", "text-blue-800");
    expect(chip).toHaveTextContent("draft");
  });

  it("renders accepted status with green styling", () => {
    render(<QuoteStatusChip status="accepted" />);

    const chip = screen.getByLabelText("Quote status: accepted");
    expect(chip).toHaveClass("bg-green-100", "text-green-800");
    expect(chip).toHaveTextContent("accepted");
  });

  it("renders invoiced status with purple styling", () => {
    render(<QuoteStatusChip status="invoiced" />);

    const chip = screen.getByLabelText("Quote status: invoiced");
    expect(chip).toHaveClass("bg-purple-100", "text-purple-800");
    expect(chip).toHaveTextContent("invoiced");
  });

  it("includes an accessible aria-label", () => {
    render(<QuoteStatusChip status="draft" />);

    expect(screen.getByLabelText("Quote status: draft")).toBeInTheDocument();
  });

  it("falls back to neutral styling for unknown status values", () => {
    render(<QuoteStatusChip status={"cancelled" as never} />);

    const chip = screen.getByLabelText("Quote status: cancelled");
    expect(chip).toHaveClass("bg-zinc-100", "text-zinc-700");
    expect(chip).toHaveTextContent("cancelled");
  });
});
