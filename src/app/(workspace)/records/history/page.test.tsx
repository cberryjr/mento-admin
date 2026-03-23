import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/features/record-history/server/queries/get-record-history", () => ({
  getRecordHistory: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function buildRecordChain() {
  return {
    client: {
      entityType: "client" as const,
      entityId: "client-1",
      label: "Sunrise Yoga Studio",
      href: "/clients/client-1",
      isCurrent: false,
    },
    quoteChain: [
      {
        quote: {
          entityType: "quote" as const,
          entityId: "quote-1",
          label: "Q-2026-014 - Monthly brand retainer",
          status: "draft",
          timestamp: "2026-03-14T09:15:00.000Z",
          href: "/quotes/quote-1?backTo=%2Fquotes",
          isCurrent: true,
        },
        revisions: [],
        invoices: [],
      },
    ],
    currentEntity: {
      entityType: "quote" as const,
      entityId: "quote-1",
      label: "Q-2026-014 - Monthly brand retainer",
      status: "draft",
      timestamp: "2026-03-14T09:15:00.000Z",
      href: "/quotes/quote-1?backTo=%2Fquotes",
      isCurrent: true,
    },
  };
}

describe("RecordHistoryPage", () => {
  it("renders with valid params", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    vi.mocked(getRecordHistory).mockResolvedValue({
      ok: true,
      data: buildRecordChain(),
    });

    const { default: RecordHistoryPage } = await import(
      "@/app/(workspace)/records/history/page"
    );

    const page = RecordHistoryPage({
      searchParams: Promise.resolve({ type: "quote", id: "quote-1", backTo: "/quotes" }),
    });

    render(await page);

    expect(screen.getByText("Record history")).toBeInTheDocument();
    expect(screen.getAllByText("Q-2026-014 - Monthly brand retainer").length).toBeGreaterThanOrEqual(1);
  });

  it("shows an error for missing params", async () => {
    const { default: RecordHistoryPage } = await import(
      "@/app/(workspace)/records/history/page"
    );

    const page = RecordHistoryPage({
      searchParams: Promise.resolve({}),
    });

    render(await page);

    expect(screen.getByText("Invalid parameters")).toBeInTheDocument();
  });

  it("shows an error for invalid type params", async () => {
    const { default: RecordHistoryPage } = await import(
      "@/app/(workspace)/records/history/page"
    );

    const page = RecordHistoryPage({
      searchParams: Promise.resolve({ type: "invalid", id: "some-id" }),
    });

    render(await page);

    expect(screen.getByText("Invalid parameters")).toBeInTheDocument();
  });

  it("shows a clear error state for a missing or inaccessible record", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    vi.mocked(getRecordHistory).mockResolvedValue({
      ok: false,
      error: {
        code: "UNKNOWN",
        message: "Record not found.",
      },
    });

    const { default: RecordHistoryPage } = await import(
      "@/app/(workspace)/records/history/page"
    );

    const page = RecordHistoryPage({
      searchParams: Promise.resolve({ type: "quote", id: "missing-quote" }),
    });

    render(await page);

    expect(screen.getByText("Could not load record history")).toBeInTheDocument();
    expect(screen.getByText("Record not found.")).toBeInTheDocument();
  });

  it("preserves backTo in the back link", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    vi.mocked(getRecordHistory).mockResolvedValue({
      ok: true,
      data: buildRecordChain(),
    });

    const { default: RecordHistoryPage } = await import(
      "@/app/(workspace)/records/history/page"
    );

    const page = RecordHistoryPage({
      searchParams: Promise.resolve({
        type: "quote",
        id: "quote-1",
        backTo: "/quotes?search=Sunrise",
      }),
    });

    render(await page);

    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
      "href",
      "/quotes?search=Sunrise",
    );
  });

  it("rejects protocol-relative backTo URLs and falls back to default", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    vi.mocked(getRecordHistory).mockResolvedValue({
      ok: true,
      data: buildRecordChain(),
    });

    const { default: RecordHistoryPage } = await import(
      "@/app/(workspace)/records/history/page"
    );

    const page = RecordHistoryPage({
      searchParams: Promise.resolve({
        type: "quote",
        id: "quote-1",
        backTo: "//evil.com/phishing",
      }),
    });

    render(await page);

    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
      "href",
      "/quotes",
    );
  });

  it("rejects non-slash backTo URLs and falls back to default", async () => {
    const { getRecordHistory } = await import(
      "@/features/record-history/server/queries/get-record-history"
    );

    vi.mocked(getRecordHistory).mockResolvedValue({
      ok: true,
      data: buildRecordChain(),
    });

    const { default: RecordHistoryPage } = await import(
      "@/app/(workspace)/records/history/page"
    );

    const page = RecordHistoryPage({
      searchParams: Promise.resolve({
        type: "quote",
        id: "quote-1",
        backTo: "https://evil.com",
      }),
    });

    render(await page);

    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
      "href",
      "/quotes",
    );
  });
});
