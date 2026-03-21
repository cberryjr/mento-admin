import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/features/quotes/server/queries/get-quote-preview", () => ({
  getQuotePreview: vi.fn(),
}));

vi.mock("@/features/quotes/lib/preview-readiness", () => ({
  computeReadinessIssues: vi.fn(() => []),
}));

vi.mock("@/features/quotes/components/quote-preview", () => ({
  QuotePreview: ({ editorHref }: { editorHref: string }) => (
    <a href={editorHref}>Back to editor</a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const PREVIEW_PAYLOAD = {
  quoteId: "q-reopen-1",
  clientId: "client-1",
  quoteNumber: "Q-20260321-ABC12345",
  title: "Brand Refresh Quote",
  status: "draft",
  clientName: "Acme Corp",
  clientContact: {
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "555-1234",
  },
  sections: [
    {
      id: "qs-1",
      quoteId: "q-reopen-1",
      studioId: "studio-1",
      sourceServicePackageId: "sp-1",
      title: "Design Phase",
      content: "Brand identity work",
      position: 1,
      lineItems: [],
    },
  ],
  grandTotalCents: 25000,
  terms: "Net 30",
  preparedAt: "2026-03-21T12:00:00.000Z",
  studioName: "My Studio",
  estimateBreakdown: null,
};

describe("QuotePreviewPage", () => {
  it("preserves revision-ready return navigation", async () => {
    const { getQuotePreview } = await import(
      "@/features/quotes/server/queries/get-quote-preview"
    );

    vi.mocked(getQuotePreview).mockResolvedValue({
      ok: true,
      data: PREVIEW_PAYLOAD,
    } as never);

    const { default: QuotePreviewPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/preview/page"
    );

    const page = QuotePreviewPage({
      params: Promise.resolve({ quoteId: "q-reopen-1" }),
      searchParams: Promise.resolve({ saved: "revised" }),
    });

    render(await page);

    expect(screen.getByRole("link", { name: /back to editor/i })).toHaveAttribute(
      "href",
      "/quotes/q-reopen-1?backTo=%2Fquotes&saved=revised",
    );
  });

  it("preserves revision-ready state when preview is unavailable", async () => {
    const { getQuotePreview } = await import(
      "@/features/quotes/server/queries/get-quote-preview"
    );

    vi.mocked(getQuotePreview).mockResolvedValue({
      ok: true,
      data: {
        ...PREVIEW_PAYLOAD,
        sections: [],
      },
    } as never);

    const { default: QuotePreviewPage } = await import(
      "@/app/(workspace)/quotes/[quoteId]/preview/page"
    );

    const page = QuotePreviewPage({
      params: Promise.resolve({ quoteId: "q-reopen-1" }),
      searchParams: Promise.resolve({ saved: "revised" }),
    });

    await expect(page).rejects.toThrow(
      "NEXT_REDIRECT:/quotes/q-reopen-1?backTo=%2Fquotes&preview=unavailable&saved=revised",
    );
  });
});
