import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  __resetQuoteEditorStore,
} from "@/features/quotes/store/quote-editor-store";
import type { QuoteSectionRecord } from "@/features/quotes/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/quotes/q-1",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/features/quotes/server/actions/add-quote-section", () => ({
  addQuoteSection: vi.fn(),
}));
vi.mock("@/features/quotes/server/actions/remove-quote-section", () => ({
  removeQuoteSection: vi.fn(),
}));
vi.mock("@/features/quotes/server/actions/add-quote-line-item", () => ({
  addQuoteLineItem: vi.fn(),
}));
vi.mock("@/features/quotes/server/actions/remove-quote-line-item", () => ({
  removeQuoteLineItem: vi.fn(),
}));
vi.mock("@/features/quotes/server/actions/update-quote-sections", () => ({
  updateQuoteSections: vi.fn(),
}));

afterEach(() => {
  cleanup();
  __resetQuoteEditorStore();
  vi.clearAllMocks();
});

const VALID_SECTIONS: QuoteSectionRecord[] = [
  {
    id: "qs-1",
    quoteId: "q-1",
    studioId: "s-1",
    sourceServicePackageId: "sp-1",
    title: "Design Services",
    content: "Custom design work",
    position: 1,
    lineItems: [
      {
        id: "li-1",
        quoteId: "q-1",
        quoteSectionId: "qs-1",
        studioId: "s-1",
        name: "Logo Design",
        content: "3 concepts",
        quantity: 1,
        unitLabel: "item",
        unitPriceCents: 50000,
        lineTotalCents: 50000,
        position: 1,
      },
    ],
  },
];

describe("QuoteStructureEditor", () => {
  it("renders mapped source package names", async () => {
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    render(
      <QuoteStructureEditor
        quoteId="q-1"
        initialSections={VALID_SECTIONS}
        sourcePackageNames={{ "sp-1": "Brand Launch Package" }}
      />,
    );

    expect(
      screen.getByText(/Source package: Brand Launch Package/),
    ).toBeInTheDocument();
  });

  it("shows inline validation and disables save for invalid input", async () => {
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    render(
      <QuoteStructureEditor
        quoteId="q-1"
        initialSections={[
          {
            ...VALID_SECTIONS[0],
            title: "",
            lineItems: [
              {
                ...VALID_SECTIONS[0].lineItems[0],
                name: "",
              },
            ],
          },
        ]}
        sourcePackageNames={{}}
      />,
    );

    expect(screen.getByRole("button", { name: /save draft/i })).toBeDisabled();
    expect(screen.getByText("Section title is required.")).toBeInTheDocument();
    expect(screen.getByText("Line item name is required.")).toBeInTheDocument();
  });

  it("adds a section via the server action", async () => {
    const { addQuoteSection } = await import(
      "@/features/quotes/server/actions/add-quote-section"
    );
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    vi.mocked(addQuoteSection).mockResolvedValue({
      ok: true,
      data: {
        quote: {
          sections: [...VALID_SECTIONS, {
            id: "qs-2",
            quoteId: "q-1",
            studioId: "s-1",
            sourceServicePackageId: "",
            title: "New Section",
            content: "",
            position: 2,
            lineItems: [],
          }],
        },
      },
    } as Awaited<ReturnType<typeof addQuoteSection>>);

    render(
      <QuoteStructureEditor
        quoteId="q-1"
        initialSections={VALID_SECTIONS}
        sourcePackageNames={{}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /add section/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("New Section")).toBeInTheDocument();
    });
  });

  it("saves on Enter from an editable field", async () => {
    const { updateQuoteSections } = await import(
      "@/features/quotes/server/actions/update-quote-sections"
    );
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    vi.mocked(updateQuoteSections).mockResolvedValue({
      ok: true,
      data: {
        quote: {
          sections: VALID_SECTIONS,
        },
      },
    } as Awaited<ReturnType<typeof updateQuoteSections>>);

    render(
      <QuoteStructureEditor
        quoteId="q-1"
        initialSections={VALID_SECTIONS}
        sourcePackageNames={{}}
      />,
    );

    fireEvent.keyDown(screen.getByLabelText("Section title"), {
      key: "Enter",
    });

    await waitFor(() => {
      expect(updateQuoteSections).toHaveBeenCalledTimes(1);
    });
  });

  it("reverts local edits on Escape", async () => {
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    render(
      <QuoteStructureEditor
        quoteId="q-1"
        initialSections={VALID_SECTIONS}
        sourcePackageNames={{}}
      />,
    );

    const lineItemInput = screen.getByLabelText("Line item name");
    fireEvent.change(lineItemInput, { target: { value: "Discovery Sprint" } });
    expect(screen.getByDisplayValue("Discovery Sprint")).toBeInTheDocument();

    fireEvent.keyDown(lineItemInput, { key: "Escape" });

    expect(screen.getByDisplayValue("Logo Design")).toBeInTheDocument();
  });
});
