import { create } from "zustand";

import {
  recalculateQuoteTotals,
  type QuoteLineItemRecord,
  type QuoteSectionRecord,
} from "@/features/quotes/types";

type QuoteLineItemField = keyof Pick<
  QuoteLineItemRecord,
  "name" | "content" | "quantity" | "unitLabel" | "unitPriceCents"
>;

type QuoteEditorState = {
  initialSections: QuoteSectionRecord[];
  sections: QuoteSectionRecord[];
  hasUnsavedChanges: boolean;
  isReordering: boolean;
  reorderError: string | null;
  initialize: (sections: QuoteSectionRecord[]) => void;
  replaceSections: (sections: QuoteSectionRecord[], markSaved?: boolean) => void;
  updateSectionTitle: (sectionId: string, title: string) => void;
  updateSectionContent: (sectionId: string, content: string) => void;
  updateLineItemField: (
    sectionId: string,
    lineItemId: string,
    field: QuoteLineItemField,
    value: string | number,
  ) => void;
  reorderSections: (sectionIds: string[]) => void;
  reorderLineItems: (sectionId: string, lineItemIds: string[]) => void;
  revertSection: (sectionId: string) => void;
  revertLineItem: (sectionId: string, lineItemId: string) => void;
  markSaved: (sections: QuoteSectionRecord[]) => void;
  startReordering: () => void;
  finishReordering: () => void;
  setReorderError: (message: string | null) => void;
};

function cloneSections(sections: QuoteSectionRecord[]) {
  return structuredClone(sections);
}

function normalizeSections(sections: QuoteSectionRecord[]) {
  return recalculateQuoteTotals(cloneSections(sections)).map((section, sectionIndex) => ({
    ...section,
    position: sectionIndex + 1,
  }));
}

function areSectionsEqual(
  left: QuoteSectionRecord[],
  right: QuoteSectionRecord[],
) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function buildDirtyState(
  sections: QuoteSectionRecord[],
  initialSections: QuoteSectionRecord[],
) {
  return !areSectionsEqual(sections, initialSections);
}

export const useQuoteEditorStore = create<QuoteEditorState>((set, get) => ({
  initialSections: [],
  sections: [],
  hasUnsavedChanges: false,
  isReordering: false,
  reorderError: null,
  initialize: (sections) => {
    const nextSections = normalizeSections(sections);

    set({
      initialSections: nextSections,
      sections: nextSections,
      hasUnsavedChanges: false,
      isReordering: false,
      reorderError: null,
    });
  },
  replaceSections: (sections, markSaved = true) => {
    const nextSections = normalizeSections(sections);
    const initialSections = markSaved
      ? nextSections
      : get().initialSections;

    set({
      initialSections,
      sections: nextSections,
      hasUnsavedChanges: buildDirtyState(nextSections, initialSections),
      reorderError: null,
    });
  },
  updateSectionTitle: (sectionId, title) => {
    const nextSections = normalizeSections(
      get().sections.map((section) =>
        section.id === sectionId ? { ...section, title } : section,
      ),
    );

    set((state) => ({
      sections: nextSections,
      hasUnsavedChanges: buildDirtyState(nextSections, state.initialSections),
      reorderError: null,
    }));
  },
  updateSectionContent: (sectionId, content) => {
    const nextSections = normalizeSections(
      get().sections.map((section) =>
        section.id === sectionId ? { ...section, content } : section,
      ),
    );

    set((state) => ({
      sections: nextSections,
      hasUnsavedChanges: buildDirtyState(nextSections, state.initialSections),
      reorderError: null,
    }));
  },
  updateLineItemField: (sectionId, lineItemId, field, value) => {
    const nextSections = normalizeSections(
      get().sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          lineItems: section.lineItems.map((lineItem) =>
            lineItem.id === lineItemId
              ? { ...lineItem, [field]: value }
              : lineItem,
          ),
        };
      }),
    );

    set((state) => ({
      sections: nextSections,
      hasUnsavedChanges: buildDirtyState(nextSections, state.initialSections),
      reorderError: null,
    }));
  },
  reorderSections: (sectionIds) => {
    const state = get();
    const sectionMap = new Map(state.sections.map((s) => [s.id, s]));

    const reordered = sectionIds
      .map((id) => sectionMap.get(id))
      .filter((s): s is QuoteSectionRecord => s !== undefined);

    if (reordered.length !== state.sections.length) {
      return;
    }

    const nextSections = normalizeSections(reordered);

    set({
      sections: nextSections,
      hasUnsavedChanges: buildDirtyState(nextSections, state.initialSections),
      reorderError: null,
    });
  },
  reorderLineItems: (sectionId, lineItemIds) => {
    const state = get();

    const nextSections = normalizeSections(
      state.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        const itemMap = new Map(section.lineItems.map((li) => [li.id, li]));
        const reordered = lineItemIds
          .map((id) => itemMap.get(id))
          .filter((li): li is QuoteLineItemRecord => li !== undefined);

        if (reordered.length !== section.lineItems.length) {
          return section;
        }

        return { ...section, lineItems: reordered };
      }),
    );

    set({
      sections: nextSections,
      hasUnsavedChanges: buildDirtyState(nextSections, state.initialSections),
      reorderError: null,
    });
  },
  revertSection: (sectionId) => {
    const state = get();
    const initialSection = state.initialSections.find(
      (section) => section.id === sectionId,
    );

    if (!initialSection) {
      return;
    }

    const nextSections = normalizeSections(
      state.sections.map((section) =>
        section.id === sectionId ? initialSection : section,
      ),
    );

    set({
      sections: nextSections,
      hasUnsavedChanges: buildDirtyState(nextSections, state.initialSections),
      reorderError: null,
    });
  },
  revertLineItem: (sectionId, lineItemId) => {
    const state = get();
    const initialSection = state.initialSections.find(
      (section) => section.id === sectionId,
    );
    const initialLineItem = initialSection?.lineItems.find(
      (lineItem) => lineItem.id === lineItemId,
    );

    if (!initialLineItem) {
      return;
    }

    const nextSections = normalizeSections(
      state.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          lineItems: section.lineItems.map((lineItem) =>
            lineItem.id === lineItemId ? initialLineItem : lineItem,
          ),
        };
      }),
    );

    set({
      sections: nextSections,
      hasUnsavedChanges: buildDirtyState(nextSections, state.initialSections),
      reorderError: null,
    });
  },
  markSaved: (sections) => {
    const nextSections = normalizeSections(sections);

    set({
      initialSections: nextSections,
      sections: nextSections,
      hasUnsavedChanges: false,
      isReordering: false,
      reorderError: null,
    });
  },
  startReordering: () => {
    set({ isReordering: true, reorderError: null });
  },
  finishReordering: () => {
    set({ isReordering: false });
  },
  setReorderError: (message) => {
    set({ isReordering: false, reorderError: message });
  },
}));

export function __resetQuoteEditorStore() {
  useQuoteEditorStore.setState({
    initialSections: [],
    sections: [],
    hasUnsavedChanges: false,
    isReordering: false,
    reorderError: null,
  });
}
