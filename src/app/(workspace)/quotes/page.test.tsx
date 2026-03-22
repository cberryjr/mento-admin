import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/quotes/server/queries/list-quotes", () => ({
  listQuotes: vi.fn(),
}));

import QuotesPage from "@/app/(workspace)/quotes/page";
import { listQuotes } from "@/features/quotes/server/queries/list-quotes";
import type { QuoteSummary } from "@/features/quotes/server/queries/list-quotes";

afterEach(() => {
  cleanup();
});

const QUOTES: QuoteSummary[] = [
  {
    id: "quote-accepted",
    quoteNumber: "Q-20260321-AAAA1111",
    title: "Accepted Rebrand",
    status: "accepted",
    updatedAt: "2026-03-21T16:30:00.000Z",
  },
  {
    id: "quote-draft",
    quoteNumber: "Q-20260320-BBBB2222",
    title: "Draft Discovery Sprint",
    status: "draft",
    updatedAt: "2026-03-20T12:15:00.000Z",
  },
];

describe("QuotesPage", () => {
  beforeEach(() => {
    vi.mocked(listQuotes).mockResolvedValue({
      ok: true,
      data: {
        quotes: QUOTES,
      },
      meta: {
        total: QUOTES.length,
      },
    });
  });

  it("renders quote rows with status chips and updated dates", async () => {
    const ui = await QuotesPage();
    render(ui);

    const acceptedRow = screen.getByRole("link", { name: /Open Accepted Rebrand/i });
    expect(within(acceptedRow).getByLabelText("Quote status: accepted")).toBeVisible();
    expect(within(acceptedRow).getByText("Mar 21, 2026")).toBeVisible();

    const draftRow = screen.getByRole("link", { name: /Open Draft Discovery Sprint/i });
    expect(within(draftRow).getByLabelText("Quote status: draft")).toBeVisible();
    expect(within(draftRow).getByText("Mar 20, 2026")).toBeVisible();

    const reviseLink = screen.getByRole("link", {
      name: /Revise Draft Discovery Sprint/i,
    });
    expect(reviseLink).toHaveAttribute(
      "href",
      "/quotes/quote-draft?backTo=%2Fquotes&saved=revised",
    );
    expect(
      screen.queryByRole("link", { name: /Revise Accepted Rebrand/i }),
    ).not.toBeInTheDocument();
  });

  it("renders an empty state with a single create CTA when no quotes exist", async () => {
    vi.mocked(listQuotes).mockResolvedValue({
      ok: true,
      data: {
        quotes: [],
      },
      meta: {
        total: 0,
      },
    });

    const ui = await QuotesPage();
    render(ui);

    expect(screen.getByText("No quotes yet")).toBeVisible();
    expect(screen.getAllByRole("link", { name: "Start quote draft" })).toHaveLength(1);
  });

  it("renders an inline error alert when the quotes query fails", async () => {
    vi.mocked(listQuotes).mockResolvedValue({
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Could not load quotes.",
      },
    });

    const ui = await QuotesPage();
    render(ui);

    expect(screen.getByText("Could not load quotes")).toBeVisible();
    expect(screen.getByText("Refresh the page and try again.")).toBeVisible();
  });
});
