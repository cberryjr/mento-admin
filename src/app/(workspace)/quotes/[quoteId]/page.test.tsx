import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  usePathname: vi.fn(() => "/quotes/q-1"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: ReactNode }) => children,
  closestCenter: vi.fn(),
  KeyboardSensor: class {},
  PointerSensor: class {},
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn((...sensors: unknown[]) => sensors),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: ReactNode }) => children,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: {},
  useSortable: ({ id }: { id: string }) => ({
    attributes: { "data-sortable-id": id },
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: { toString: vi.fn(() => undefined) },
  },
}));

vi.mock("@/features/quotes/server/queries/get-quote-by-id", () => ({
  getQuoteById: vi.fn(),
}));

vi.mock("@/features/clients/server/queries/get-client-by-id", () => ({
  getClientById: vi.fn(),
}));

vi.mock("@/features/service-packages/server/queries/get-service-package-by-id", () => ({
  getServicePackageById: vi.fn(),
}));

function buildQuote(overrides: Record<string, unknown> = {}) {
  return {
    id: "q-reopen-1",
    studioId: "studio-1",
    clientId: "client-1",
    quoteNumber: "Q-20260321-ABC12345",
    title: "Brand Refresh Quote",
    status: "draft",
    terms: "Net 30",
    selectedServicePackageIds: ["sp-1"],
    generatedAt: "2026-03-20T00:00:00.000Z",
    createdAt: "2026-03-20T00:00:00.000Z",
    updatedAt: "2026-03-21T00:00:00.000Z",
    sections: [
      {
        id: "qs-1",
        quoteId: "q-reopen-1",
        studioId: "studio-1",
        sourceServicePackageId: "sp-1",
        title: "Design Phase",
        content: "Brand identity work",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            quoteId: "q-reopen-1",
            quoteSectionId: "qs-1",
            studioId: "studio-1",
            name: "Logo Concepts",
            content: "3 initial concepts",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 25000,
            lineTotalCents: 25000,
            position: 1,
          },
        ],
      },
    ],
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function setupMocks({
  quoteResult,
  clientResult = { ok: true, data: { client: { name: "Acme Corp" } } },
  servicePackageResult = { ok: true, data: { servicePackage: { name: "Brand Launch Package" } } },
}: {
  quoteResult: { ok: true; data: { quote: ReturnType<typeof buildQuote> } } | { ok: false; error: { code: string; message: string } };
  clientResult?:
    | { ok: true; data: { client: { name: string } } }
    | { ok: false; error: { code: string; message: string } };
  servicePackageResult?: { ok: true; data: { servicePackage: { name: string } } };
}) {
  const { getQuoteById } = await import("@/features/quotes/server/queries/get-quote-by-id");
  const { getClientById } = await import("@/features/clients/server/queries/get-client-by-id");
  const { getServicePackageById } = await import(
    "@/features/service-packages/server/queries/get-service-package-by-id"
  );

  vi.mocked(getQuoteById).mockResolvedValue(quoteResult as never);
  vi.mocked(getClientById).mockResolvedValue(clientResult as never);
  vi.mocked(getServicePackageById).mockResolvedValue(servicePackageResult as never);
}

describe("QuoteDetailPage", () => {
  it("renders editor for a draft quote with generated content", async () => {
    await setupMocks({
      quoteResult: { ok: true, data: { quote: buildQuote() } },
    });

    const { default: QuoteDetailPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/page"
    );

    const page = QuoteDetailPage({
      params: Promise.resolve({ quoteId: "q-reopen-1" }),
      searchParams: Promise.resolve({}),
    });

    render(await page);

    expect(screen.getByText("Quote details")).toBeInTheDocument();
    expect(screen.getByText("Brand Refresh Quote")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText(/Quote editor/)).toBeInTheDocument();
  });

  it("shows revision-ready messaging when saved=revised for a draft quote", async () => {
    await setupMocks({
      quoteResult: { ok: true, data: { quote: buildQuote() } },
    });

    const { default: QuoteDetailPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/page"
    );

    const page = QuoteDetailPage({
      params: Promise.resolve({ quoteId: "q-reopen-1" }),
      searchParams: Promise.resolve({ saved: "revised" }),
    });

    render(await page);

    expect(screen.getByText("Revising existing quote")).toBeInTheDocument();
    expect(
      screen.getByText(/You are continuing from an existing quote/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Preview quote" })).toHaveAttribute(
      "href",
      "/quotes/q-reopen-1/preview?backTo=%2Fquotes&saved=revised",
    );
  });

  it("does not show revision-ready messaging for non-draft quotes", async () => {
    await setupMocks({
      quoteResult: {
        ok: true,
        data: { quote: buildQuote({ status: "accepted" }) },
      },
    });

    const { default: QuoteDetailPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/page"
    );

    const page = QuoteDetailPage({
      params: Promise.resolve({ quoteId: "q-reopen-1" }),
      searchParams: Promise.resolve({ saved: "revised" }),
    });

    render(await page);

    expect(screen.queryByText("Revising existing quote")).not.toBeInTheDocument();
  });

  it("renders read-only view for accepted quotes", async () => {
    await setupMocks({
      quoteResult: {
        ok: true,
        data: { quote: buildQuote({ status: "accepted" }) },
      },
    });

    const { default: QuoteDetailPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/page"
    );

    const page = QuoteDetailPage({
      params: Promise.resolve({ quoteId: "q-reopen-1" }),
      searchParams: Promise.resolve({}),
    });

    render(await page);

    expect(screen.getByText("Quote details")).toBeInTheDocument();
    expect(screen.getByText("accepted")).toBeInTheDocument();
    expect(screen.queryByText(/Quote editor/)).not.toBeInTheDocument();
    expect(screen.getByText("Design Phase")).toBeInTheDocument();
  });

  it("renders read-only view for invoiced quotes", async () => {
    await setupMocks({
      quoteResult: {
        ok: true,
        data: { quote: buildQuote({ status: "invoiced" }) },
      },
    });

    const { default: QuoteDetailPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/page"
    );

    const page = QuoteDetailPage({
      params: Promise.resolve({ quoteId: "q-reopen-1" }),
      searchParams: Promise.resolve({}),
    });

    render(await page);

    expect(screen.getByText("invoiced")).toBeInTheDocument();
    expect(screen.queryByText(/Quote editor/)).not.toBeInTheDocument();
  });

  it("renders recovery UI for operational load failure", async () => {
    await setupMocks({
      quoteResult: {
        ok: false,
        error: { code: "UNKNOWN", message: "Could not load quote." },
      },
    });

    const { default: QuoteDetailPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/page"
    );

    const page = QuoteDetailPage({
      params: Promise.resolve({ quoteId: "q-reopen-1" }),
      searchParams: Promise.resolve({}),
    });

    render(await page);

    expect(screen.getByText("Could not load quote")).toBeInTheDocument();
    expect(
      screen.getByText(/Try reloading the page/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to quotes/i })).toBeInTheDocument();
  });

  it("renders recovery UI when linked client context cannot be loaded", async () => {
    await setupMocks({
      quoteResult: { ok: true, data: { quote: buildQuote() } },
      clientResult: {
        ok: false,
        error: { code: "UNKNOWN", message: "Could not load client." },
      },
    });

    const { default: QuoteDetailPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/page"
    );

    const page = QuoteDetailPage({
      params: Promise.resolve({ quoteId: "q-reopen-1" }),
      searchParams: Promise.resolve({ saved: "revised" }),
    });

    render(await page);

    expect(screen.getByText("Could not load quote")).toBeInTheDocument();
    expect(screen.getByText("Could not load client.")).toBeInTheDocument();
    expect(
      screen.queryByText("Revising existing quote"),
    ).not.toBeInTheDocument();
  });

  it("calls notFound for missing or unauthorized quotes", async () => {
    const { notFound } = await import("next/navigation");

    await setupMocks({
      quoteResult: {
        ok: false,
        error: { code: "UNKNOWN", message: "Quote not found." },
      },
    });

    const { default: QuoteDetailPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/page"
    );

    const page = QuoteDetailPage({
      params: Promise.resolve({ quoteId: "q-missing" }),
      searchParams: Promise.resolve({}),
    });

    await expect(page).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("does not show revision-ready messaging without saved=revised param", async () => {
    await setupMocks({
      quoteResult: { ok: true, data: { quote: buildQuote() } },
    });

    const { default: QuoteDetailPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/page"
    );

    const page = QuoteDetailPage({
      params: Promise.resolve({ quoteId: "q-reopen-1" }),
      searchParams: Promise.resolve({}),
    });

    render(await page);

    expect(screen.queryByText("Revising existing quote")).not.toBeInTheDocument();
  });

  it("preserves client context visibility on reopened draft", async () => {
    await setupMocks({
      quoteResult: { ok: true, data: { quote: buildQuote() } },
      clientResult: { ok: true, data: { client: { name: "Sunrise Yoga Studio" } } },
    });

    const { default: QuoteDetailPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/page"
    );

    const page = QuoteDetailPage({
      params: Promise.resolve({ quoteId: "q-reopen-1" }),
      searchParams: Promise.resolve({ saved: "revised" }),
    });

    render(await page);

    expect(screen.getByText("Sunrise Yoga Studio")).toBeInTheDocument();
    expect(screen.getByText("Revising existing quote")).toBeInTheDocument();
  });
});
