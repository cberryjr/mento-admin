import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { QuoteSectionRecord } from "@/features/quotes/types";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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
        isPending={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /remove line item/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /remove line item/i })[1]);

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
        isPending={false}
      />,
    );

    const titleInput = screen.getByLabelText("Section title");
    fireEvent.keyDown(titleInput, { key: "Enter" });
    fireEvent.keyDown(titleInput, { key: "Escape" });

    expect(onSaveRequested).toHaveBeenCalledTimes(1);
    expect(onResetSection).toHaveBeenCalledWith("qs-1");
  });
});
