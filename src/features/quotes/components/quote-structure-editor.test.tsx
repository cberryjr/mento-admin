import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
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

const routerPush = vi.fn();

let sectionDragHandlers: Array<
  (event: { active: { id: string }; over: { id: string } | null }) => void
> = [];

vi.mock("next/navigation", () => ({
  usePathname: () => "/quotes/q-1",
  useRouter: () => ({
    push: routerPush,
  }),
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children, onDragEnd }: { children: ReactNode; onDragEnd?: typeof sectionDragHandlers[number] }) => {
    if (onDragEnd) {
      sectionDragHandlers.push(onDragEnd);
    }
    return children;
  },
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
    Transform: {
      toString: vi.fn(() => undefined),
    },
  },
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
vi.mock("@/features/quotes/server/actions/update-quote-line-item", () => ({
  updateQuoteLineItem: vi.fn(),
}));
vi.mock("@/features/quotes/server/actions/reorder-quote-sections", () => ({
  reorderQuoteSections: vi.fn(),
}));
vi.mock("@/features/quotes/server/actions/reorder-quote-line-items", () => ({
  reorderQuoteLineItems: vi.fn(),
}));

afterEach(() => {
  cleanup();
  __resetQuoteEditorStore();
  vi.clearAllMocks();
  sectionDragHandlers = [];
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

const TWO_SECTIONS: QuoteSectionRecord[] = [
  ...VALID_SECTIONS,
  {
    id: "qs-2",
    quoteId: "q-1",
    studioId: "s-1",
    sourceServicePackageId: "",
    title: "Strategy Workshop",
    content: "Facilitated planning",
    position: 2,
    lineItems: [],
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
          clientId="client-1"
          backTo="/quotes"
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
          clientId="client-1"
          backTo="/quotes"
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
          clientId="client-1"
          backTo="/quotes"
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
          clientId="client-1"
          backTo="/quotes"
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
          clientId="client-1"
          backTo="/quotes"
        />,
    );

    const lineItemInput = screen.getByLabelText("Line item name");
    fireEvent.change(lineItemInput, { target: { value: "Discovery Sprint" } });
    expect(screen.getByDisplayValue("Discovery Sprint")).toBeInTheDocument();

    fireEvent.keyDown(lineItemInput, { key: "Escape" });

    expect(screen.getByDisplayValue("Logo Design")).toBeInTheDocument();
  });

  it("persists section drag reorders", async () => {
    const { reorderQuoteSections } = await import(
      "@/features/quotes/server/actions/reorder-quote-sections"
    );
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    vi.mocked(reorderQuoteSections).mockResolvedValue({
      ok: true,
      data: {
        quote: {
          sections: [TWO_SECTIONS[1], TWO_SECTIONS[0]],
        },
      },
    } as Awaited<ReturnType<typeof reorderQuoteSections>>);

    render(
        <QuoteStructureEditor
          quoteId="q-1"
          initialSections={TWO_SECTIONS}
          sourcePackageNames={{}}
          clientId="client-1"
          backTo="/quotes"
        />,
    );

    sectionDragHandlers.forEach((handler) => {
      handler({
        active: { id: "qs-2" },
        over: { id: "qs-1" },
      });
    });

    await waitFor(() => {
      expect(reorderQuoteSections).toHaveBeenCalledWith("q-1", ["qs-2", "qs-1"]);
    });
  });

  it("auto-saves a line item on blur", async () => {
    const { updateQuoteLineItem } = await import(
      "@/features/quotes/server/actions/update-quote-line-item"
    );
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    vi.mocked(updateQuoteLineItem).mockResolvedValue({
      ok: true,
      data: {
        quote: {
          sections: [
            {
              ...VALID_SECTIONS[0],
              lineItems: [
                {
                  ...VALID_SECTIONS[0].lineItems[0],
                  unitPriceCents: 75000,
                  lineTotalCents: 75000,
                },
              ],
            },
          ],
        },
      },
    } as Awaited<ReturnType<typeof updateQuoteLineItem>>);

    render(
        <QuoteStructureEditor
          quoteId="q-1"
          initialSections={VALID_SECTIONS}
          sourcePackageNames={{}}
          clientId="client-1"
          backTo="/quotes"
        />,
    );

    const priceInput = screen.getByLabelText("Unit price in dollars");
    fireEvent.change(priceInput, { target: { value: "750" } });
    fireEvent.blur(priceInput);

    await waitFor(() => {
      expect(updateQuoteLineItem).toHaveBeenCalledWith(
        "q-1",
        "qs-1",
        "li-1",
        "Logo Design",
        "3 concepts",
        1,
        "item",
        75000,
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("Line item saved.");
    });
  });

  it("updates the readiness indicator as quote fields change", async () => {
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    render(
        <QuoteStructureEditor
          quoteId="q-1"
          initialSections={VALID_SECTIONS}
          sourcePackageNames={{}}
          clientId="client-1"
          backTo="/quotes"
        />,
    );

    const nameInput = screen.getByLabelText("Line item name");
    fireEvent.change(nameInput, { target: { value: "" } });

    expect(screen.getByText("1 item need attention")).toBeInTheDocument();

    fireEvent.change(nameInput, { target: { value: "Logo Design" } });

    expect(screen.getByText("Ready for preview")).toBeInTheDocument();
  });

  it("opens the preview route when the quote is ready", async () => {
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    render(
        <QuoteStructureEditor
          quoteId="q-1"
          initialSections={VALID_SECTIONS}
          sourcePackageNames={{}}
          clientId="client-1"
          backTo="/quotes"
        />,
    );

    fireEvent.click(screen.getByRole("button", { name: /^preview$/i }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith(
        "/quotes/q-1/preview?backTo=%2Fquotes",
      );
    });
  });

  it("auto-saves before opening preview when local edits exist", async () => {
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
          sections: [
            {
              ...VALID_SECTIONS[0],
              lineItems: [
                {
                  ...VALID_SECTIONS[0].lineItems[0],
                  name: "Strategy Intensive",
                },
              ],
            },
          ],
        },
      },
    } as Awaited<ReturnType<typeof updateQuoteSections>>);

    render(
      <QuoteStructureEditor
        quoteId="q-1"
        initialSections={VALID_SECTIONS}
        sourcePackageNames={{}}
        clientId="client-1"
        backTo="/quotes"
      />,
    );

    fireEvent.change(screen.getByLabelText("Line item name"), {
      target: { value: "Strategy Intensive" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^preview$/i }));

    await waitFor(() => {
      expect(updateQuoteSections).toHaveBeenCalledTimes(1);
      expect(routerPush).toHaveBeenCalledWith(
        "/quotes/q-1/preview?backTo=%2Fquotes",
      );
    });
  });

  it("disables the Preview button when readiness issues exist", async () => {
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    render(
        <QuoteStructureEditor
          quoteId="q-1"
          initialSections={VALID_SECTIONS}
          sourcePackageNames={{}}
          clientId=""
          backTo="/quotes"
        />,
    );

    expect(screen.getByRole("button", { name: /^preview$/i })).toBeDisabled();
  });

  it("shows success feedback after explicit save", async () => {
    const { updateQuoteSections } = await import(
      "@/features/quotes/server/actions/update-quote-sections"
    );
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    vi.mocked(updateQuoteSections).mockResolvedValue({
      ok: true,
      data: { quote: { sections: VALID_SECTIONS } },
    } as Awaited<ReturnType<typeof updateQuoteSections>>);

    render(
      <QuoteStructureEditor
        quoteId="q-1"
        initialSections={VALID_SECTIONS}
        sourcePackageNames={{}}
        clientId="client-1"
        backTo="/quotes"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Quote draft saved successfully.",
      );
    });
  });

  it("shows error feedback on save failure", async () => {
    const { updateQuoteSections } = await import(
      "@/features/quotes/server/actions/update-quote-sections"
    );
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    vi.mocked(updateQuoteSections).mockResolvedValue({
      ok: false,
      error: { code: "CONFLICT", message: "Quote was modified by another session." },
    } as Awaited<ReturnType<typeof updateQuoteSections>>);

    render(
      <QuoteStructureEditor
        quoteId="q-1"
        initialSections={VALID_SECTIONS}
        sourcePackageNames={{}}
        clientId="client-1"
        backTo="/quotes"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Quote was modified by another session.",
      );
    });

    expect(screen.getByText("Save failed")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Reload the quote to pick up the other session's changes, or save again after reviewing them\./,
      ),
    ).toBeInTheDocument();
  });

  it("keeps the Save draft button enabled after a failed save for retry", async () => {
    const { updateQuoteSections } = await import(
      "@/features/quotes/server/actions/update-quote-sections"
    );
    const { QuoteStructureEditor } = await import(
      "@/features/quotes/components/quote-structure-editor"
    );

    vi.mocked(updateQuoteSections).mockResolvedValue({
      ok: false,
      error: { code: "UNKNOWN", message: "Network error." },
    } as Awaited<ReturnType<typeof updateQuoteSections>>);

    render(
      <QuoteStructureEditor
        quoteId="q-1"
        initialSections={VALID_SECTIONS}
        sourcePackageNames={{}}
        clientId="client-1"
        backTo="/quotes"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /save draft/i })).toBeEnabled();
  });
});
