import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/features/quotes/server/queries/get-quote-by-id", () => ({
  getQuoteById: vi.fn(),
}));

vi.mock("@/features/quotes/server/quotes-repository", () => ({
  listQuoteRevisions: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RevisionsPage", () => {
  it("fetches quote and revisions server-side and renders timeline", async () => {
    const { getQuoteById } = await import(
      "@/features/quotes/server/queries/get-quote-by-id"
    );
    const { listQuoteRevisions } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(getQuoteById).mockResolvedValue({
      ok: true,
      data: {
        quote: {
          id: "q-1",
          studioId: "studio-1",
          clientId: "c-1",
          quoteNumber: "Q-20260315-ABC",
          title: "Test Quote",
          status: "draft" as const,
          terms: "Net 30",
          selectedServicePackageIds: [],
          generatedAt: null,
          createdAt: "2026-03-14T09:00:00.000Z",
          updatedAt: "2026-03-15T10:00:00.000Z",
          sections: [],
        },
      },
    });

    vi.mocked(listQuoteRevisions).mockResolvedValue([
      {
        id: "rev-1",
        quoteId: "q-1",
        studioId: "studio-1",
        revisionNumber: 1,
        snapshotData: { sections: [] },
        title: "Quote v1",
        terms: "Net 30",
        createdAt: "2026-03-14T09:15:00.000Z",
      },
    ]);

    const { default: RevisionsPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/revisions/page"
    );

    render(
      await RevisionsPage({
        params: Promise.resolve({ quoteId: "q-1" }),
        searchParams: Promise.resolve({}),
      }) as React.ReactElement,
    );

    expect(screen.getAllByText("Revision history").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Test Quote/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Current version")).toBeInTheDocument();
    expect(screen.getByText("Revision 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Breadcrumb")).toBeInTheDocument();
  });

  it("renders error state when quote loading fails", async () => {
    const { getQuoteById } = await import(
      "@/features/quotes/server/queries/get-quote-by-id"
    );

    vi.mocked(getQuoteById).mockResolvedValue({
      ok: false,
      error: { code: "UNKNOWN", message: "Quote not found." },
    });

    const { default: RevisionsPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/revisions/page"
    );

    expect(() =>
      RevisionsPage({
        params: Promise.resolve({ quoteId: "q-1" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("handles zero revisions gracefully", async () => {
    const { getQuoteById } = await import(
      "@/features/quotes/server/queries/get-quote-by-id"
    );
    const { listQuoteRevisions } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(getQuoteById).mockResolvedValue({
      ok: true,
      data: {
        quote: {
          id: "q-2",
          studioId: "studio-1",
          clientId: "c-1",
          quoteNumber: "Q-20260315-XYZ",
          title: "New Quote",
          status: "draft" as const,
          terms: "",
          selectedServicePackageIds: [],
          generatedAt: null,
          createdAt: "2026-03-15T10:00:00.000Z",
          updatedAt: "2026-03-15T10:00:00.000Z",
          sections: [],
        },
      },
    });

    vi.mocked(listQuoteRevisions).mockResolvedValue([]);

    const { default: RevisionsPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/revisions/page"
    );

    render(
      await RevisionsPage({
        params: Promise.resolve({ quoteId: "q-2" }),
        searchParams: Promise.resolve({}),
      }) as React.ReactElement,
    );

    expect(screen.getByText(/No previous revisions yet/)).toBeInTheDocument();
    expect(screen.getByText("Current version")).toBeInTheDocument();
    expect(screen.getByText("Current working version")).toBeInTheDocument();
    expect(screen.getByText("Current version detail")).toBeInTheDocument();
  });

  it("treats unauthorized access like a missing quote", async () => {
    const { getQuoteById } = await import(
      "@/features/quotes/server/queries/get-quote-by-id"
    );
    const { listQuoteRevisions } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(getQuoteById).mockResolvedValue({
      ok: false,
      error: { code: "UNKNOWN", message: "Quote not found." },
    });

    const { default: RevisionsPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/revisions/page"
    );

    await expect(
      RevisionsPage({
        params: Promise.resolve({ quoteId: "q-private" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(listQuoteRevisions).not.toHaveBeenCalled();
  });

  it("passes the selected revision from search params into the timeline", async () => {
    const { getQuoteById } = await import(
      "@/features/quotes/server/queries/get-quote-by-id"
    );
    const { listQuoteRevisions } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(getQuoteById).mockResolvedValue({
      ok: true,
      data: {
        quote: {
          id: "q-1",
          studioId: "studio-1",
          clientId: "c-1",
          quoteNumber: "Q-20260315-ABC",
          title: "Test Quote",
          status: "draft" as const,
          terms: "Net 30",
          selectedServicePackageIds: [],
          generatedAt: null,
          createdAt: "2026-03-14T09:00:00.000Z",
          updatedAt: "2026-03-15T10:00:00.000Z",
          sections: [],
        },
      },
    });

    vi.mocked(listQuoteRevisions).mockResolvedValue([
      {
        id: "rev-1",
        quoteId: "q-1",
        studioId: "studio-1",
        revisionNumber: 1,
        snapshotData: { sections: [] },
        title: "Quote v1",
        terms: "Net 30",
        createdAt: "2026-03-14T09:15:00.000Z",
      },
    ]);

    const { default: RevisionsPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/revisions/page"
    );

    render(
      await RevisionsPage({
        params: Promise.resolve({ quoteId: "q-1" }),
        searchParams: Promise.resolve({ selectedRevision: "rev-1" }),
      }) as React.ReactElement,
    );

    expect(screen.getByText("Revision 1 detail")).toBeInTheDocument();
  });
});
