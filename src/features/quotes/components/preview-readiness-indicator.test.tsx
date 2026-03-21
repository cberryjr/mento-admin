import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { PreviewReadinessIndicator } from "@/features/quotes/components/preview-readiness-indicator";
import type { QuoteSectionRecord } from "@/features/quotes/types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const SECTIONS: QuoteSectionRecord[] = [
  {
    id: "qs-1",
    quoteId: "q-1",
    studioId: "studio-1",
    sourceServicePackageId: "sp-1",
    title: "Brand strategy",
    content: "Discovery and planning",
    position: 1,
    lineItems: [
      {
        id: "li-1",
        quoteId: "q-1",
        quoteSectionId: "qs-1",
        studioId: "studio-1",
        name: "Workshop",
        content: "Kickoff session",
        quantity: 1,
        unitLabel: "session",
        unitPriceCents: 25000,
        lineTotalCents: 25000,
        position: 1,
      },
    ],
  },
];

describe("PreviewReadinessIndicator", () => {
  it("shows the ready state when the quote is complete", () => {
    render(<PreviewReadinessIndicator sections={SECTIONS} clientId="client-1" />);

    expect(screen.getByText("Ready for preview")).toBeInTheDocument();
  });

  it("reports a missing section", () => {
    render(<PreviewReadinessIndicator sections={[]} clientId="client-1" />);

    expect(screen.getByText("1 item need attention")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show/i }));
    expect(screen.getByText(/at least one section/i)).toBeInTheDocument();
  });

  it("reports a missing line item name", () => {
    render(
      <PreviewReadinessIndicator
        sections={[
          {
            ...SECTIONS[0],
            lineItems: [{ ...SECTIONS[0].lineItems[0], name: "" }],
          },
        ]}
        clientId="client-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /show/i }));
    expect(screen.getByText(/missing a name/i)).toBeInTheDocument();
  });

  it("reports a negative price", () => {
    render(
      <PreviewReadinessIndicator
        sections={[
          {
            ...SECTIONS[0],
            lineItems: [{ ...SECTIONS[0].lineItems[0], unitPriceCents: -100 }],
          },
        ]}
        clientId="client-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /show/i }));
    expect(screen.getByText(/negative price/i)).toBeInTheDocument();
  });

  it("reports a quantity below one", () => {
    render(
      <PreviewReadinessIndicator
        sections={[
          {
            ...SECTIONS[0],
            lineItems: [{ ...SECTIONS[0].lineItems[0], quantity: 0 }],
          },
        ]}
        clientId="client-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /show/i }));
    expect(screen.getByText(/quantity less than 1/i)).toBeInTheDocument();
  });

  it("reports a missing client", () => {
    render(<PreviewReadinessIndicator sections={SECTIONS} clientId="" />);

    fireEvent.click(screen.getByRole("button", { name: /show/i }));
    expect(screen.getByText(/associated with a client/i)).toBeInTheDocument();
  });

  it("shows Open preview button when ready and quoteId is provided", () => {
    render(
      <PreviewReadinessIndicator
        sections={SECTIONS}
        clientId="client-1"
        previewHref="/quotes/q-1/preview"
      />,
    );

    expect(screen.getByText("Ready for preview")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /open preview/i });
    expect(link).toHaveAttribute("href", "/quotes/q-1/preview");
  });

  it("uses the open callback when provided", () => {
    const onOpenPreview = vi.fn();

    render(
      <PreviewReadinessIndicator
        sections={SECTIONS}
        clientId="client-1"
        previewHref="/quotes/q-1/preview"
        onOpenPreview={onOpenPreview}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /open preview/i }));

    expect(onOpenPreview).toHaveBeenCalledTimes(1);
  });

  it("does not show Open preview button when not ready", () => {
    render(
      <PreviewReadinessIndicator
        sections={[]}
        clientId="client-1"
        previewHref="/quotes/q-1/preview"
      />,
    );

    expect(screen.queryByRole("link", { name: /open preview/i })).not.toBeInTheDocument();
  });

  it("does not show Open preview button when previewHref is not provided", () => {
    render(<PreviewReadinessIndicator sections={SECTIONS} clientId="client-1" />);

    expect(screen.getByText("Ready for preview")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /open preview/i })).not.toBeInTheDocument();
  });

  it("focuses the client summary when the missing client issue is selected", () => {
    render(
      <>
        <div id="quote-client-summary" tabIndex={-1}>
          Client summary
        </div>
        <PreviewReadinessIndicator sections={SECTIONS} clientId="" />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: /show/i }));
    fireEvent.click(
      screen.getByRole("button", {
        name: /quote must be associated with a client/i,
      }),
    );

    expect(document.activeElement).toBe(screen.getByText("Client summary"));
  });
});
