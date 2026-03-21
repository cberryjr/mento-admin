import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import type { QuoteSectionRecord } from "@/features/quotes/types";

let latestLineItemDragEnd:
  | ((event: { active: { id: string }; over: { id: string } | null }) => void)
  | undefined;

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children, onDragEnd }: { children: ReactNode; onDragEnd?: typeof latestLineItemDragEnd }) => {
    latestLineItemDragEnd = onDragEnd;
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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  latestLineItemDragEnd = undefined;
});

const SECTION: QuoteSectionRecord = {
  id: "qs-1",
  quoteId: "q-1",
  studioId: "s-1",
  sourceServicePackageId: "sp-1",
  title: "Design Services",
  content: "Custom design",
  position: 1,
  lineItems: [
    {
      id: "li-1",
      quoteId: "q-1",
      quoteSectionId: "qs-1",
      studioId: "s-1",
      name: "Logo Design",
      content: "3 concepts",
      quantity: 2,
      unitLabel: "hours",
      unitPriceCents: 5000,
      lineTotalCents: 10000,
      position: 1,
    },
    {
      id: "li-2",
      quoteId: "q-1",
      quoteSectionId: "qs-1",
      studioId: "s-1",
      name: "Discovery Sprint",
      content: "Planning workshop",
      quantity: 1,
      unitLabel: "session",
      unitPriceCents: 15000,
      lineTotalCents: 15000,
      position: 2,
    },
  ],
};

describe("QuoteEditorSection", () => {
  it("renders the mapped source package label", async () => {
    const { QuoteEditorSection } = await import(
      "@/features/quotes/components/quote-editor-section"
    );

    render(
      <QuoteEditorSection
        section={SECTION}
        sectionIndex={0}
        sourcePackageName="Brand Launch Package"
        fieldErrors={{}}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onLineItemChange={vi.fn()}
        onRemoveSection={vi.fn()}
        onAddLineItem={vi.fn()}
        onRemoveLineItem={vi.fn()}
        onSaveRequested={vi.fn()}
        onResetSection={vi.fn()}
        onResetLineItem={vi.fn()}
        onLineItemBlur={vi.fn()}
        onMoveLineItemUp={vi.fn()}
        onMoveLineItemDown={vi.fn()}
        onReorderLineItems={vi.fn()}
        isPending={false}
      />,
    );

    expect(
      screen.getByText(/Source package: Brand Launch Package/),
    ).toBeInTheDocument();
  });

  it("opens a confirmation dialog before removing a line item", async () => {
    const onRemoveLineItem = vi.fn();
    const { QuoteEditorSection } = await import(
      "@/features/quotes/components/quote-editor-section"
    );

    render(
      <QuoteEditorSection
        section={SECTION}
        sectionIndex={0}
        sourcePackageName="Brand Launch Package"
        fieldErrors={{}}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onLineItemChange={vi.fn()}
        onRemoveSection={vi.fn()}
        onAddLineItem={vi.fn()}
        onRemoveLineItem={onRemoveLineItem}
        onSaveRequested={vi.fn()}
        onResetSection={vi.fn()}
        onResetLineItem={vi.fn()}
        onLineItemBlur={vi.fn()}
        onMoveLineItemUp={vi.fn()}
        onMoveLineItemDown={vi.fn()}
        onReorderLineItems={vi.fn()}
        isPending={false}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /remove line item/i })[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^remove line item$/i,
      }),
    );

    expect(onRemoveLineItem).toHaveBeenCalledWith("qs-1", "li-1");
  });

  it("saves on Enter and reverts on Escape", async () => {
    const onSaveRequested = vi.fn();
    const onResetSection = vi.fn();
    const { QuoteEditorSection } = await import(
      "@/features/quotes/components/quote-editor-section"
    );

    render(
      <QuoteEditorSection
        section={SECTION}
        sectionIndex={0}
        sourcePackageName="Brand Launch Package"
        fieldErrors={{}}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onLineItemChange={vi.fn()}
        onRemoveSection={vi.fn()}
        onAddLineItem={vi.fn()}
        onRemoveLineItem={vi.fn()}
        onSaveRequested={onSaveRequested}
        onResetSection={onResetSection}
        onResetLineItem={vi.fn()}
        onLineItemBlur={vi.fn()}
        onMoveLineItemUp={vi.fn()}
        onMoveLineItemDown={vi.fn()}
        onReorderLineItems={vi.fn()}
        isPending={false}
      />,
    );

    const titleInput = screen.getByLabelText("Section title");
    fireEvent.keyDown(titleInput, { key: "Enter" });
    fireEvent.keyDown(titleInput, { key: "Escape" });

    expect(onSaveRequested).toHaveBeenCalledTimes(1);
    expect(onResetSection).toHaveBeenCalledWith("qs-1");
  });

  it("reorders line items through drag and drop", async () => {
    const onReorderLineItems = vi.fn();
    const { QuoteEditorSection } = await import(
      "@/features/quotes/components/quote-editor-section"
    );

    render(
      <QuoteEditorSection
        section={SECTION}
        sectionIndex={0}
        sourcePackageName="Brand Launch Package"
        fieldErrors={{}}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onLineItemChange={vi.fn()}
        onRemoveSection={vi.fn()}
        onAddLineItem={vi.fn()}
        onRemoveLineItem={vi.fn()}
        onSaveRequested={vi.fn()}
        onResetSection={vi.fn()}
        onResetLineItem={vi.fn()}
        onLineItemBlur={vi.fn()}
        onMoveLineItemUp={vi.fn()}
        onMoveLineItemDown={vi.fn()}
        onReorderLineItems={onReorderLineItems}
        isPending={false}
      />,
    );

    latestLineItemDragEnd?.({
      active: { id: "li-2" },
      over: { id: "li-1" },
    });

    expect(onReorderLineItems).toHaveBeenCalledWith("qs-1", ["li-2", "li-1"]);
  });

  it("auto-saves line items on blur", async () => {
    const onLineItemBlur = vi.fn();
    const { QuoteEditorSection } = await import(
      "@/features/quotes/components/quote-editor-section"
    );

    render(
      <QuoteEditorSection
        section={SECTION}
        sectionIndex={0}
        sourcePackageName="Brand Launch Package"
        fieldErrors={{}}
        onTitleChange={vi.fn()}
        onContentChange={vi.fn()}
        onLineItemChange={vi.fn()}
        onRemoveSection={vi.fn()}
        onAddLineItem={vi.fn()}
        onRemoveLineItem={vi.fn()}
        onSaveRequested={vi.fn()}
        onResetSection={vi.fn()}
        onResetLineItem={vi.fn()}
        onLineItemBlur={onLineItemBlur}
        onMoveLineItemUp={vi.fn()}
        onMoveLineItemDown={vi.fn()}
        onReorderLineItems={vi.fn()}
        isPending={false}
      />,
    );

    fireEvent.blur(screen.getAllByLabelText("Unit price in dollars")[0]);

    expect(onLineItemBlur).toHaveBeenCalledWith("qs-1", "li-1");
  });
});
