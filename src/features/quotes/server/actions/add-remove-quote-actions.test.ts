import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/lib/errors/app-error";
import { __resetQuotesStore } from "@/features/quotes/server/store/quotes-store";
import type { QuoteDetailRecord } from "@/features/quotes/types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/auth/require-session", () => ({
  requireSession: vi.fn(),
}));

describe("update-quote-sections action", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();
  });

  it("updates quote sections for a draft quote", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: ["sp-1"],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: "qs-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "sp-1",
        title: "Original Title",
        content: "",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            quoteId: quote.id,
            quoteSectionId: "qs-1",
            studioId: "default-studio",
            name: "Item 1",
            content: "",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 5000,
            lineTotalCents: 5000,
            position: 1,
          },
        ],
      },
    ]);

    const { updateQuoteSections } = await import(
      "@/features/quotes/server/actions/update-quote-sections"
    );

    const result = await updateQuoteSections({
      quoteId: quote.id,
      sections: [
        {
          id: "qs-1",
          title: "Updated Title",
          content: "New description",
          position: 1,
          lineItems: [
            {
              id: "li-1",
              name: "Updated Item",
              content: "Updated description",
              quantity: 3,
              unitLabel: "hours",
              unitPriceCents: 5000,
              position: 1,
            },
          ],
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.sections).toHaveLength(1);
      expect(result.data.quote.sections[0].title).toBe("Updated Title");
      expect(result.data.quote.sections[0].lineItems[0].lineTotalCents).toBe(
        15000,
      );
    }
  });

  it("rejects unauthenticated access", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { AppError } = await import("@/lib/errors/app-error");

    vi.mocked(requireSession).mockRejectedValue(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { updateQuoteSections } = await import(
      "@/features/quotes/server/actions/update-quote-sections"
    );

    const result = await updateQuoteSections({
      quoteId: "q-1",
      sections: [],
    });

    expect(result.ok).toBe(false);
  });
});

describe("addQuoteSection action", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();
  });

  it("adds a new section to a draft quote", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    const { addQuoteSection } = await import(
      "@/features/quotes/server/actions/add-quote-section"
    );

    const result = await addQuoteSection(quote.id);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.sections).toHaveLength(1);
      expect(result.data.quote.sections[0].title).toBe("New Section");
      expect(result.data.quote.sections[0].lineItems).toHaveLength(0);
    }
  });

  it("rejects cross-studio section creation", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { createQuoteRecord } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-2",
        email: "owner2@example.com",
        role: "owner",
        studioId: "other-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const { addQuoteSection } = await import(
      "@/features/quotes/server/actions/add-quote-section"
    );

    const result = await addQuoteSection(quote.id);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Quote not found.");
    }
  });
});

describe("removeQuoteSection action", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();
  });

  it("removes a section from a draft quote", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: "qs-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Section 1",
        content: "",
        position: 1,
        lineItems: [],
      },
      {
        id: "qs-2",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Section 2",
        content: "",
        position: 2,
        lineItems: [],
      },
    ]);

    const { removeQuoteSection } = await import(
      "@/features/quotes/server/actions/remove-quote-section"
    );

    const result = await removeQuoteSection(quote.id, "qs-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.sections).toHaveLength(1);
      expect(result.data.quote.sections[0].title).toBe("Section 2");
      expect(result.data.quote.sections[0].position).toBe(1);
    }
  });
});

describe("addQuoteLineItem action", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();
  });

  it("adds a line item to an existing section", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: "qs-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Section 1",
        content: "",
        position: 1,
        lineItems: [],
      },
    ]);

    const { addQuoteLineItem } = await import(
      "@/features/quotes/server/actions/add-quote-line-item"
    );

    const result = await addQuoteLineItem(quote.id, "qs-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.sections[0].lineItems).toHaveLength(1);
      expect(result.data.quote.sections[0].lineItems[0].name).toBe(
        "New Line Item",
      );
    }
  });

  it("rejects unauthenticated line-item creation", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    vi.mocked(requireSession).mockRejectedValue(
      new AppError("UNAUTHORIZED", "You must sign in to continue."),
    );

    const { addQuoteLineItem } = await import(
      "@/features/quotes/server/actions/add-quote-line-item"
    );

    const result = await addQuoteLineItem("q-1", "qs-1");

    expect(result.ok).toBe(false);
  });
});

describe("removeQuoteLineItem action", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    __resetQuotesStore();
  });

  it("removes a line item from a section", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: "qs-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Section 1",
        content: "",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            quoteId: quote.id,
            quoteSectionId: "qs-1",
            studioId: "default-studio",
            name: "Item 1",
            content: "",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 1000,
            lineTotalCents: 1000,
            position: 1,
          },
          {
            id: "li-2",
            quoteId: quote.id,
            quoteSectionId: "qs-1",
            studioId: "default-studio",
            name: "Item 2",
            content: "",
            quantity: 2,
            unitLabel: "hours",
            unitPriceCents: 5000,
            lineTotalCents: 10000,
            position: 2,
          },
        ],
      },
    ]);

    const { removeQuoteLineItem } = await import(
      "@/features/quotes/server/actions/remove-quote-line-item"
    );

    const result = await removeQuoteLineItem(quote.id, "qs-1", "li-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.quote.sections[0].lineItems).toHaveLength(1);
      expect(result.data.quote.sections[0].lineItems[0].name).toBe("Item 2");
      expect(result.data.quote.sections[0].lineItems[0].position).toBe(1);
    }
  });

  it("rejects non-draft line-item removal", async () => {
    const { requireSession } = await import("@/features/auth/require-session");
    const { createQuoteRecord, saveQuoteSections } = await import(
      "@/features/quotes/server/quotes-repository"
    );

    vi.mocked(requireSession).mockResolvedValue({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        role: "owner",
        studioId: "default-studio",
      },
      expires: new Date(Date.now() + 360000).toISOString(),
    });

    const quote = await createQuoteRecord("default-studio", {
      clientId: "client-1",
      title: "Test Quote",
      selectedServicePackageIds: [],
      terms: "",
    });

    await saveQuoteSections(quote.id, "default-studio", [
      {
        id: "qs-1",
        quoteId: quote.id,
        studioId: "default-studio",
        sourceServicePackageId: "",
        title: "Section 1",
        content: "",
        position: 1,
        lineItems: [
          {
            id: "li-1",
            quoteId: quote.id,
            quoteSectionId: "qs-1",
            studioId: "default-studio",
            name: "Item 1",
            content: "",
            quantity: 1,
            unitLabel: "item",
            unitPriceCents: 1000,
            lineTotalCents: 1000,
            position: 1,
          },
        ],
      },
    ]);

    const store = (
      globalThis as typeof globalThis & {
        __mentoQuotesStore?: Map<string, QuoteDetailRecord>;
      }
    ).__mentoQuotesStore;
    const storedQuote = store?.get(quote.id);

    if (storedQuote) {
      storedQuote.status = "accepted";
    }

    const { removeQuoteLineItem } = await import(
      "@/features/quotes/server/actions/remove-quote-line-item"
    );

    const result = await removeQuoteLineItem(quote.id, "qs-1", "li-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Only draft quotes can be edited.");
    }
  });
});
