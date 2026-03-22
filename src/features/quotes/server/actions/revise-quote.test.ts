import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession } from "@/features/auth/session";
import { __resetQuotesStore } from "@/features/quotes/server/store/quotes-store";
import type { QuoteDetailRecord } from "@/features/quotes/types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("@/features/quotes/server/quotes-repository", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/features/quotes/server/quotes-repository")
  >();

  return {
    ...actual,
    saveQuoteSections: vi.fn(actual.saveQuoteSections),
  };
});

function setSession(studioId = "default-studio"): AuthSession {
  return {
    user: {
      id: "owner-1",
      email: "owner@example.com",
      role: "owner",
      studioId,
    },
    expires: new Date(Date.now() + 360000).toISOString(),
  };
}

function buildStoredSections(quoteId: string) {
  return [
    {
      id: "qs-1",
      quoteId,
      studioId: "default-studio",
      sourceServicePackageId: "sp-1",
      title: "Initial Scope",
      content: "Original content",
      position: 1,
      lineItems: [
        {
          id: "li-1",
          quoteId,
          quoteSectionId: "qs-1",
          studioId: "default-studio",
          name: "Discovery",
          content: "Workshop",
          quantity: 1,
          unitLabel: "session",
          unitPriceCents: 25000,
          lineTotalCents: 25000,
          position: 1,
        },
      ],
    },
  ];
}

function buildRevisionInput(quoteId: string) {
  return {
    quoteId,
    sections: [
      {
        id: "qs-1",
        title: "Revised Scope",
        content: "Refined content",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            name: "Discovery",
            content: "Workshop",
            quantity: 2,
            unitLabel: "session",
            unitPriceCents: 30000,
            position: 1,
          },
        ],
      },
    ],
  };
}

describe("reviseQuote", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();

    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockResolvedValue(setSession());
  });

  it("creates a snapshot from the previous quote state and persists the revision", async () => {
    const repository = await import("@/features/quotes/server/quotes-repository");
    const { reviseQuote } = await import(
      "@/features/quotes/server/actions/revise-quote"
    );

    const quote = await repository.createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "Net 30",
    });

    await repository.saveQuoteSections(
      quote.id,
      "default-studio",
      buildStoredSections(quote.id),
    );

    const result = await reviseQuote(buildRevisionInput(quote.id));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.revisionNumber).toBe(1);
      expect(result.data.quote.sections[0].title).toBe("Revised Scope");
      expect(result.data.quote.sections[0].lineItems[0].quantity).toBe(2);
    }

    const revisions = await repository.listQuoteRevisions(
      quote.id,
      "default-studio",
    );

    expect(revisions).toHaveLength(1);
    expect(revisions[0].revisionNumber).toBe(1);
    expect(revisions[0].snapshotData.sections[0].title).toBe("Initial Scope");
    expect(revisions[0].snapshotData.sections[0].lineItems[0].quantity).toBe(1);
  });

  it("returns a failure envelope without corrupting quote data when persistence fails after snapshot", async () => {
    const repository = await import("@/features/quotes/server/quotes-repository");

    const quote = await repository.createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "Net 30",
    });

    await repository.saveQuoteSections(
      quote.id,
      "default-studio",
      buildStoredSections(quote.id),
    );

    vi.mocked(repository.saveQuoteSections).mockRejectedValueOnce(
      new Error("boom"),
    );

    const { reviseQuote } = await import(
      "@/features/quotes/server/actions/revise-quote"
    );

    const result = await reviseQuote(buildRevisionInput(quote.id));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Could not save revision.");
    }

    const reopenedQuote = await repository.getQuoteById(quote.id);
    expect(reopenedQuote).not.toBeNull();
    expect(reopenedQuote!.sections[0].title).toBe("Initial Scope");
    expect(reopenedQuote!.sections[0].lineItems[0].quantity).toBe(1);

    const revisions = await repository.listQuoteRevisions(
      quote.id,
      "default-studio",
    );
    expect(revisions).toHaveLength(1);
    expect(revisions[0].snapshotData.sections[0].title).toBe("Initial Scope");
  });

  it("rejects non-draft quotes", async () => {
    const repository = await import("@/features/quotes/server/quotes-repository");
    const { reviseQuote } = await import(
      "@/features/quotes/server/actions/revise-quote"
    );

    const quote = await repository.createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    const store = (
      globalThis as typeof globalThis & {
        __mentoQuotesStore?: Map<string, QuoteDetailRecord>;
      }
    ).__mentoQuotesStore;
    const storedQuote = store?.get(quote.id);

    if (storedQuote) {
      storedQuote.status = "accepted";
    }

    const result = await reviseQuote(buildRevisionInput(quote.id));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Only draft quotes can be revised.");
    }
  });
});
