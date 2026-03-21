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
  revertSection: (sectionId: string) => void;
  revertLineItem: (sectionId: string, lineItemId: string) => void;
  markSaved: (sections: QuoteSectionRecord[]) => void;
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
  initialize: (sections) => {
    const nextSections = normalizeSections(sections);

    set({
      initialSections: nextSections,
      sections: nextSections,
      hasUnsavedChanges: false,
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
    }));
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
    });
  },
  markSaved: (sections) => {
    const nextSections = normalizeSections(sections);

    set({
      initialSections: nextSections,
      sections: nextSections,
      hasUnsavedChanges: false,
    });
  },
}));

export function __resetQuoteEditorStore() {
  useQuoteEditorStore.setState({
    initialSections: [],
    sections: [],
    hasUnsavedChanges: false,
  });
}
