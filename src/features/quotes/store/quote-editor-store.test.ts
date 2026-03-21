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
});
