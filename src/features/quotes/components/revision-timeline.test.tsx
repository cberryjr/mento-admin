import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { QuoteRevisionRecord, QuoteSectionRecord } from "@/features/quotes/types";

afterEach(() => {
  cleanup();
});

function makeSection(overrides: Partial<QuoteSectionRecord> = {}): QuoteSectionRecord {
  return {
    id: "qs-1",
    quoteId: "q-1",
    studioId: "studio-1",
    sourceServicePackageId: "sp-1",
    title: "Design Services",
    content: "Custom design work",
    position: 1,
    lineItems: [
      {
        id: "li-1",
        quoteId: "q-1",
        quoteSectionId: "qs-1",
        studioId: "studio-1",
        name: "Logo Design",
        content: "3 concepts",
        quantity: 1,
        unitLabel: "item",
        unitPriceCents: 50000,
        lineTotalCents: 50000,
        position: 1,
      },
    ],
    ...overrides,
  };
}

function makeRevision(overrides: Partial<QuoteRevisionRecord> = {}): QuoteRevisionRecord {
  return {
    id: "rev-1",
    quoteId: "q-1",
    studioId: "studio-1",
    revisionNumber: 1,
    snapshotData: { sections: [makeSection()] },
    title: "Quote v1",
    terms: "Net 30",
    createdAt: "2026-03-14T09:15:00.000Z",
    ...overrides,
  };
}

const defaultProps = {
  revisions: [makeRevision()] as QuoteRevisionRecord[],
  currentVersion: {
    title: "Quote v2",
    terms: "Net 15",
    updatedAt: "2026-03-15T10:00:00.000Z",
    sections: [
      makeSection({
        title: "Updated Design",
        lineItems: [
          {
            id: "li-2",
            quoteId: "q-1",
            quoteSectionId: "qs-1",
            studioId: "studio-1",
            name: "Brand Refresh",
            content: "Updated concepts",
            quantity: 2,
            unitLabel: "hours",
            unitPriceCents: 7500,
            lineTotalCents: 15000,
            position: 1,
          },
        ],
      }),
    ],
  },
};

describe("RevisionTimeline", () => {
  it("renders revision list with revision number and timestamp", async () => {
    const { RevisionTimeline } = await import(
      "@/features/quotes/components/revision-timeline"
    );

    render(<RevisionTimeline {...defaultProps} />);

    expect(screen.getByText("Revision history")).toBeInTheDocument();
    expect(screen.getByText("Current version")).toBeInTheDocument();
    expect(screen.getByText("Current working version")).toBeInTheDocument();
    expect(screen.getByText("Revision 1")).toBeInTheDocument();
    expect(screen.getByText(/Saved/)).toBeInTheDocument();
  });

  it("highlights current version with a Current badge", async () => {
    const { RevisionTimeline } = await import(
      "@/features/quotes/components/revision-timeline"
    );

    render(<RevisionTimeline {...defaultProps} />);

    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByLabelText("Current version")).toBeInTheDocument();
  });

  it("shows empty state when no revisions exist", async () => {
    const { RevisionTimeline } = await import(
      "@/features/quotes/components/revision-timeline"
    );

    render(
      <RevisionTimeline
        revisions={[]}
        currentVersion={defaultProps.currentVersion}
      />,
    );

    expect(screen.getByText(/No previous revisions yet/)).toBeInTheDocument();
    expect(screen.getByText("Current version")).toBeInTheDocument();
    expect(screen.getByText("Current working version")).toBeInTheDocument();
    expect(screen.getByText("Current version detail")).toBeInTheDocument();
  });

  it("loads snapshot data when View action is clicked", async () => {
    const { RevisionTimeline } = await import(
      "@/features/quotes/components/revision-timeline"
    );

    render(<RevisionTimeline {...defaultProps} />);

    const viewButton = screen.getByLabelText("View revision 1");
    fireEvent.click(viewButton);

    expect(screen.getByText("Revision 1 detail")).toBeInTheDocument();
    expect(screen.getByText("Quote v1")).toBeInTheDocument();
    expect(screen.getByText("Net 30")).toBeInTheDocument();
    expect(screen.getByText("Design Services")).toBeInTheDocument();
    expect(screen.getByText("Logo Design")).toBeInTheDocument();
    expect(screen.getAllByText("$500.00").length).toBeGreaterThanOrEqual(1);
  });

  it("dismisses historical view with Back to current version", async () => {
    const { RevisionTimeline } = await import(
      "@/features/quotes/components/revision-timeline"
    );

    render(<RevisionTimeline {...defaultProps} />);

    fireEvent.click(screen.getByLabelText("View revision 1"));
    expect(screen.getByText("Revision 1 detail")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Back to current version"));
    expect(screen.queryByText("Revision 1 detail")).not.toBeInTheDocument();
    expect(screen.getByText("Current version detail")).toBeInTheDocument();
  });

  it("marks selected revision button as Viewing", async () => {
    const { RevisionTimeline } = await import(
      "@/features/quotes/components/revision-timeline"
    );

    render(<RevisionTimeline {...defaultProps} />);

    const viewButton = screen.getByLabelText("View revision 1");
    fireEvent.click(viewButton);

    expect(screen.getByText("Viewing")).toBeInTheDocument();
  });

  it("uses aria-current on the selected version", async () => {
    const { RevisionTimeline } = await import(
      "@/features/quotes/components/revision-timeline"
    );

    render(<RevisionTimeline {...defaultProps} />);

    const currentButton = screen.getByText("Current working version").closest("button");
    expect(currentButton).toHaveAttribute("aria-pressed", "true");

    const revisionButton = screen.getByLabelText("View revision 1");
    fireEvent.click(revisionButton);

    expect(revisionButton).toHaveAttribute("aria-pressed", "true");
    expect(currentButton).toHaveAttribute("aria-pressed", "false");
  });

  it("dismisses the selected revision with Escape and returns focus", async () => {
    const { RevisionTimeline } = await import(
      "@/features/quotes/components/revision-timeline"
    );

    render(<RevisionTimeline {...defaultProps} />);

    const revisionButton = screen.getByLabelText("View revision 1");
    fireEvent.click(revisionButton);

    expect(screen.getByText("Revision 1 detail")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByText("Revision 1 detail")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(document.activeElement).toBe(revisionButton);
    });
  });

  it("returns focus to the triggering revision after Back to current version", async () => {
    const { RevisionTimeline } = await import(
      "@/features/quotes/components/revision-timeline"
    );

    render(<RevisionTimeline {...defaultProps} />);

    const revisionButton = screen.getByLabelText("View revision 1");
    fireEvent.click(revisionButton);
    fireEvent.click(screen.getByText("Back to current version"));

    await waitFor(() => {
      expect(document.activeElement).toBe(revisionButton);
    });
  });

  it("renders current version detail by default when revisions exist", async () => {
    const { RevisionTimeline } = await import(
      "@/features/quotes/components/revision-timeline"
    );

    render(<RevisionTimeline {...defaultProps} />);

    expect(screen.getByText("Current version detail")).toBeInTheDocument();
    expect(screen.getByText("Quote v2")).toBeInTheDocument();
    expect(screen.getByText("Updated Design")).toBeInTheDocument();
    expect(screen.getByText("Brand Refresh")).toBeInTheDocument();
  });

  it("renders multiple revisions in order", async () => {
    const { RevisionTimeline } = await import(
      "@/features/quotes/components/revision-timeline"
    );

    const revisions = [
      makeRevision({
        id: "rev-2",
        revisionNumber: 2,
        title: "Quote v2 old",
        createdAt: "2026-03-15T08:00:00.000Z",
      }),
      makeRevision({
        id: "rev-1",
        revisionNumber: 1,
        title: "Quote v1",
        createdAt: "2026-03-14T09:15:00.000Z",
      }),
    ];

    render(
      <RevisionTimeline
        revisions={revisions}
        currentVersion={defaultProps.currentVersion}
      />,
    );

    expect(screen.getByText("Current version")).toBeInTheDocument();
    expect(screen.getByText("Revision 2")).toBeInTheDocument();
    expect(screen.getByText("Revision 1")).toBeInTheDocument();

    const viewButtons = screen.getAllByText("View");
    expect(viewButtons).toHaveLength(2);
  });

  it("opens the requested revision by default when selectedRevisionId is provided", async () => {
    const { RevisionTimeline } = await import(
      "@/features/quotes/components/revision-timeline"
    );

    render(
      <RevisionTimeline
        revisions={defaultProps.revisions}
        currentVersion={defaultProps.currentVersion}
        initialSelectedRevisionId="rev-1"
      />,
    );

    expect(screen.getByText("Revision 1 detail")).toBeInTheDocument();
    expect(screen.getByText("Viewing")).toBeInTheDocument();
  });
});
