import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetQuoteEditorStore,
  useQuoteEditorStore,
} from "@/features/quotes/store/quote-editor-store";
import type { QuoteSectionRecord } from "@/features/quotes/types";

const INITIAL_SECTIONS: QuoteSectionRecord[] = [
  {
    id: "qs-1",
    quoteId: "q-1",
    studioId: "studio-1",
    sourceServicePackageId: "sp-1",
    title: "Branding",
    content: "Brand direction",
    position: 1,
    lineItems: [
      {
        id: "li-1",
        quoteId: "q-1",
        quoteSectionId: "qs-1",
        studioId: "studio-1",
        name: "Logo design",
        content: "3 concepts",
        quantity: 2,
        unitLabel: "hours",
        unitPriceCents: 5000,
        lineTotalCents: 10000,
        position: 1,
      },
    ],
  },
];

const TWO_SECTIONS: QuoteSectionRecord[] = [
  {
    id: "qs-1",
    quoteId: "q-1",
    studioId: "studio-1",
    sourceServicePackageId: "sp-1",
    title: "Branding",
    content: "",
    position: 1,
    lineItems: [
      {
        id: "li-1",
        quoteId: "q-1",
        quoteSectionId: "qs-1",
        studioId: "studio-1",
        name: "Logo",
        content: "",
        quantity: 1,
        unitLabel: "item",
        unitPriceCents: 1000,
        lineTotalCents: 1000,
        position: 1,
      },
      {
        id: "li-2",
        quoteId: "q-1",
        quoteSectionId: "qs-1",
        studioId: "studio-1",
        name: "Icons",
        content: "",
        quantity: 1,
        unitLabel: "set",
        unitPriceCents: 500,
        lineTotalCents: 500,
        position: 2,
      },
    ],
  },
  {
    id: "qs-2",
    quoteId: "q-1",
    studioId: "studio-1",
    sourceServicePackageId: "",
    title: "Development",
    content: "",
    position: 2,
    lineItems: [],
  },
];

describe("quote-editor-store", () => {
  beforeEach(() => {
    __resetQuoteEditorStore();
  });

  it("tracks dirty state after local edits", () => {
    const { initialize, updateSectionTitle } = useQuoteEditorStore.getState();

    initialize(INITIAL_SECTIONS);
    updateSectionTitle("qs-1", "Updated branding");

    const state = useQuoteEditorStore.getState();

    expect(state.sections[0].title).toBe("Updated branding");
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it("recalculates line totals when quantity changes", () => {
    const { initialize, updateLineItemField } = useQuoteEditorStore.getState();

    initialize(INITIAL_SECTIONS);
    updateLineItemField("qs-1", "li-1", "quantity", 3);

    const state = useQuoteEditorStore.getState();

    expect(state.sections[0].lineItems[0].lineTotalCents).toBe(15000);
  });

  it("reverts a line item back to the last saved snapshot", () => {
    const { initialize, updateLineItemField, revertLineItem } =
      useQuoteEditorStore.getState();

    initialize(INITIAL_SECTIONS);
    updateLineItemField("qs-1", "li-1", "name", "Exploration sprint");
    revertLineItem("qs-1", "li-1");

    const state = useQuoteEditorStore.getState();

    expect(state.sections[0].lineItems[0].name).toBe("Logo design");
    expect(state.hasUnsavedChanges).toBe(false);
  });

  it("reorders sections and updates positions", () => {
    const { initialize, reorderSections } = useQuoteEditorStore.getState();

    initialize(TWO_SECTIONS);
    reorderSections(["qs-2", "qs-1"]);

    const state = useQuoteEditorStore.getState();

    expect(state.sections[0].id).toBe("qs-2");
    expect(state.sections[0].position).toBe(1);
    expect(state.sections[1].id).toBe("qs-1");
    expect(state.sections[1].position).toBe(2);
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it("reorders line items within a section", () => {
    const { initialize, reorderLineItems } = useQuoteEditorStore.getState();

    initialize(TWO_SECTIONS);
    reorderLineItems("qs-1", ["li-2", "li-1"]);

    const state = useQuoteEditorStore.getState();

    expect(state.sections[0].lineItems[0].id).toBe("li-2");
    expect(state.sections[0].lineItems[0].position).toBe(1);
    expect(state.sections[0].lineItems[1].id).toBe("li-1");
    expect(state.sections[0].lineItems[1].position).toBe(2);
  });

  it("ignores reorder with mismatched IDs", () => {
    const { initialize, reorderSections } = useQuoteEditorStore.getState();

    initialize(TWO_SECTIONS);
    reorderSections(["qs-999"]);

    const state = useQuoteEditorStore.getState();

    expect(state.sections[0].id).toBe("qs-1");
    expect(state.sections[1].id).toBe("qs-2");
  });

  it("tracks reorder progress and errors", () => {
    const { startReordering, setReorderError, finishReordering } =
      useQuoteEditorStore.getState();

    startReordering();
    expect(useQuoteEditorStore.getState().isReordering).toBe(true);

    setReorderError("Could not reorder line items.");
    expect(useQuoteEditorStore.getState().isReordering).toBe(false);
    expect(useQuoteEditorStore.getState().reorderError).toBe(
      "Could not reorder line items.",
    );

    finishReordering();
    expect(useQuoteEditorStore.getState().isReordering).toBe(false);
  });
});
