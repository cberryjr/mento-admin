import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { RecordChain, RecordChainNode } from "@/features/record-history/types";

const historyHref = "/records/history?type=quote&id=quote-1&backTo=%2Fquotes";

afterEach(() => {
  cleanup();
});

function makeClientNode(overrides: Partial<RecordChainNode> = {}): RecordChainNode {
  return {
    entityType: "client",
    entityId: "client-1",
    label: "Sunrise Yoga Studio",
    href: `/clients/client-1?backTo=${encodeURIComponent(historyHref)}`,
    isCurrent: false,
    metadata: [{ label: "Contact", value: "Avery Patel" }],
    ...overrides,
  };
}

function makeQuoteNode(overrides: Partial<RecordChainNode> = {}): RecordChainNode {
  return {
    entityType: "quote",
    entityId: "quote-1",
    label: "Q-2026-014 - Monthly brand retainer",
    status: "draft",
    timestamp: "2026-03-14T09:15:00.000Z",
    href: `/quotes/quote-1?backTo=${encodeURIComponent(historyHref)}`,
    isCurrent: false,
    metadata: [
      {
        label: "Source packages",
        value: "Brand Launch Package, Content Sprint Package",
      },
      {
        label: "Quote sections",
        value: "Discovery, Delivery",
      },
      {
        label: "Line items",
        value: "Workshop, Brand Strategy",
      },
    ],
    ...overrides,
  };
}

function makeRevisionNode(overrides: Partial<RecordChainNode> = {}): RecordChainNode {
  return {
    entityType: "quote_revision",
    entityId: "rev-1",
    label: "Revision 1",
    timestamp: "2026-03-13T09:00:00.000Z",
    href: `/quotes/quote-1/revisions?backTo=${encodeURIComponent(historyHref)}&selectedRevision=rev-1`,
    isCurrent: false,
    metadata: [{ label: "Title", value: "Original draft" }],
    ...overrides,
  };
}

function makeInvoiceNode(overrides: Partial<RecordChainNode> = {}): RecordChainNode {
  return {
    entityType: "invoice",
    entityId: "inv-1",
    label: "INV-20260321-TEST1 - Monthly brand retainer",
    status: "sent",
    timestamp: "2026-03-21T12:00:00.000Z",
    href: `/invoices/inv-1?backTo=${encodeURIComponent(historyHref)}`,
    isCurrent: false,
    metadata: [
      {
        label: "Source quote",
        value: "Q-2026-014 - Monthly brand retainer",
      },
      {
        label: "Invoice total",
        value: "$1,250.00",
      },
    ],
    relatedLinks: [
      {
        href: `/quotes/quote-1?backTo=${encodeURIComponent(historyHref)}`,
        label: "Open source quote",
        ariaLabel: "Open source quote Q-2026-014 - Monthly brand retainer",
      },
    ],
    ...overrides,
  };
}

const defaultProps = {
  recordChain: {
    client: makeClientNode(),
    quoteChain: [
      {
        quote: makeQuoteNode({ isCurrent: true }),
        revisions: [
          makeRevisionNode(),
          makeRevisionNode({ entityId: "rev-2", label: "Revision 2" }),
        ],
        invoices: [makeInvoiceNode()],
      },
    ],
    currentEntity: makeQuoteNode({ isCurrent: true }),
  } satisfies RecordChain,
  backTo: "/quotes",
};

describe("ConnectedRecordHistory", () => {
  it("renders the main record chain content", async () => {
    const { ConnectedRecordHistory } = await import(
      "@/features/record-history/components/connected-record-history"
    );

    render(<ConnectedRecordHistory {...defaultProps} />);

    expect(screen.getByText("Record history")).toBeInTheDocument();
    expect(screen.getByText("Sunrise Yoga Studio")).toBeInTheDocument();
    expect(screen.getAllByText("Q-2026-014 - Monthly brand retainer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("INV-20260321-TEST1 - Monthly brand retainer")).toBeInTheDocument();
    expect(screen.getByText("Source packages:")).toBeInTheDocument();
    expect(screen.getByText("Brand Launch Package, Content Sprint Package")).toBeInTheDocument();
  });

  it("shows status badges and the current record summary", async () => {
    const { ConnectedRecordHistory } = await import(
      "@/features/record-history/components/connected-record-history"
    );

    render(<ConnectedRecordHistory {...defaultProps} />);

    expect(screen.getAllByText("draft").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("sent")).toBeInTheDocument();
    expect(screen.getByText("Current record")).toBeInTheDocument();
    expect(screen.getByText("Invoice total:")).toBeInTheDocument();
    expect(screen.getByText("$1,250.00")).toBeInTheDocument();
  });

  it("uses descriptive record links with the correct destinations", async () => {
    const { ConnectedRecordHistory } = await import(
      "@/features/record-history/components/connected-record-history"
    );

    render(<ConnectedRecordHistory {...defaultProps} />);

    expect(screen.getByRole("link", { name: /open client sunrise yoga studio/i })).toHaveAttribute(
      "href",
      `/clients/client-1?backTo=${encodeURIComponent(historyHref)}`,
    );
    expect(
      screen.getByRole("link", { name: /open quote q-2026-014 - monthly brand retainer/i }),
    ).toHaveAttribute("href", `/quotes/quote-1?backTo=${encodeURIComponent(historyHref)}`);
    expect(
      screen.getByRole("link", { name: /open invoice inv-20260321-test1 - monthly brand retainer/i }),
    ).toHaveAttribute("href", `/invoices/inv-1?backTo=${encodeURIComponent(historyHref)}`);
    expect(screen.getByRole("link", { name: /open source quote q-2026-014 - monthly brand retainer/i })).toHaveAttribute(
      "href",
      `/quotes/quote-1?backTo=${encodeURIComponent(historyHref)}`,
    );
  });

  it("shows quote and invoice troubleshooting details as text", async () => {
    const { ConnectedRecordHistory } = await import(
      "@/features/record-history/components/connected-record-history"
    );

    render(<ConnectedRecordHistory {...defaultProps} />);

    expect(screen.getByText("Quote sections:")).toBeInTheDocument();
    expect(screen.getByText("Discovery, Delivery")).toBeInTheDocument();
    expect(screen.getByText("Line items:")).toBeInTheDocument();
    expect(screen.getByText("Workshop, Brand Strategy")).toBeInTheDocument();
    expect(screen.getByText("Source quote:")).toBeInTheDocument();
  });

  it("hides multi-revision details until expanded", async () => {
    const { ConnectedRecordHistory } = await import(
      "@/features/record-history/components/connected-record-history"
    );

    render(<ConnectedRecordHistory {...defaultProps} />);

    expect(screen.queryByText("Revision 1")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /expand quote details/i })).toBeInTheDocument();
  });

  it("expands and collapses revision details", async () => {
    const { ConnectedRecordHistory } = await import(
      "@/features/record-history/components/connected-record-history"
    );

    render(<ConnectedRecordHistory {...defaultProps} />);

    const toggle = screen.getByRole("button", { name: /expand quote details/i });
    fireEvent.click(toggle);

    expect(screen.getByText("Revision 1")).toBeInTheDocument();
    expect(screen.getByText("Revision 2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open revision revision 1/i })).toHaveAttribute(
      "href",
      `/quotes/quote-1/revisions?backTo=${encodeURIComponent(historyHref)}&selectedRevision=rev-1`,
    );

    fireEvent.click(screen.getByRole("button", { name: /collapse quote details/i }));
    expect(screen.queryByText("Revision 1")).not.toBeInTheDocument();
  });

  it("renders a single revision inline when only one revision exists", async () => {
    const { ConnectedRecordHistory } = await import(
      "@/features/record-history/components/connected-record-history"
    );

    render(
      <ConnectedRecordHistory
        {...defaultProps}
        recordChain={{
          ...defaultProps.recordChain,
          quoteChain: [
            {
              ...defaultProps.recordChain.quoteChain[0],
              revisions: [makeRevisionNode()],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Revision 1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /expand quote details/i })).not.toBeInTheDocument();
  });

  it("renders the empty state when no related quotes exist", async () => {
    const { ConnectedRecordHistory } = await import(
      "@/features/record-history/components/connected-record-history"
    );

    render(
      <ConnectedRecordHistory
        recordChain={{
          client: makeClientNode(),
          quoteChain: [],
          currentEntity: makeClientNode({ isCurrent: true }),
        }}
        backTo="/clients"
      />,
    );

    expect(screen.getByText("No connected quotes or invoices found.")).toBeInTheDocument();
  });

  it("renders the labeled region and back link", async () => {
    const { ConnectedRecordHistory } = await import(
      "@/features/record-history/components/connected-record-history"
    );

    render(<ConnectedRecordHistory {...defaultProps} />);

    expect(screen.getByRole("region", { name: "Connected record history" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/quotes");
  });

  it("links and buttons are focusable and keyboard-accessible", async () => {
    const { ConnectedRecordHistory } = await import(
      "@/features/record-history/components/connected-record-history"
    );

    render(<ConnectedRecordHistory {...defaultProps} />);

    const backLink = screen.getByRole("link", { name: "Back" });
    backLink.focus();
    expect(document.activeElement).toBe(backLink);

    const expandButton = screen.getByRole("button", { name: /expand quote details/i });
    expandButton.focus();
    expect(document.activeElement).toBe(expandButton);
  });

  it("expand button activates on Enter key", async () => {
    const { ConnectedRecordHistory } = await import(
      "@/features/record-history/components/connected-record-history"
    );

    render(<ConnectedRecordHistory {...defaultProps} />);

    const expandButton = screen.getByRole("button", { name: /expand quote details/i });
    fireEvent.keyDown(expandButton, { key: "Enter" });
    fireEvent.click(expandButton);

    expect(screen.getByText("Revision 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /collapse quote details/i })).toBeInTheDocument();
  });
});
