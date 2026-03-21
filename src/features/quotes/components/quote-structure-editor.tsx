"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { QuoteEditorSection } from "@/features/quotes/components/quote-editor-section";
import { PreviewReadinessIndicator } from "@/features/quotes/components/preview-readiness-indicator";
import { buildQuotePreviewHref } from "@/features/quotes/lib/navigation";
import { computeReadinessIssues } from "@/features/quotes/lib/preview-readiness";
import { addQuoteSection } from "@/features/quotes/server/actions/add-quote-section";
import { removeQuoteSection } from "@/features/quotes/server/actions/remove-quote-section";
import { addQuoteLineItem } from "@/features/quotes/server/actions/add-quote-line-item";
import { removeQuoteLineItem } from "@/features/quotes/server/actions/remove-quote-line-item";
import { updateQuoteLineItem } from "@/features/quotes/server/actions/update-quote-line-item";
import { updateQuoteSections } from "@/features/quotes/server/actions/update-quote-sections";
import { reorderQuoteSections } from "@/features/quotes/server/actions/reorder-quote-sections";
import { reorderQuoteLineItems } from "@/features/quotes/server/actions/reorder-quote-line-items";
import {
  getUpdateQuoteSectionsFieldErrors,
  updateQuoteSectionsSchema,
} from "@/features/quotes/schemas/update-quote-sections-schema";
import { useQuoteEditorStore } from "@/features/quotes/store/quote-editor-store";
import type { QuoteSectionRecord } from "@/features/quotes/types";
import { calculateQuoteTotalCents } from "@/features/quotes/types";
import { formatCurrencyFromCents } from "@/lib/format/currency";

type QuoteStructureEditorProps = {
  quoteId: string;
  initialSections: QuoteSectionRecord[];
  sourcePackageNames: Record<string, string>;
  clientId: string;
  backTo: string;
};

function areSectionsEqual(
  left: QuoteSectionRecord[],
  right: QuoteSectionRecord[],
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getLineItemSnapshot(
  sections: QuoteSectionRecord[],
  sectionId: string,
  lineItemId: string,
) {
  const section = sections.find((candidate) => candidate.id === sectionId);
  const lineItem = section?.lineItems.find((candidate) => candidate.id === lineItemId);

  if (!section || !lineItem) {
    return null;
  }

  return { section, lineItem };
}

function hasOtherUnsavedChanges(
  currentSections: QuoteSectionRecord[],
  savedSections: QuoteSectionRecord[],
  sectionId: string,
  lineItemId: string,
): boolean {
  const savedSnapshot = getLineItemSnapshot(savedSections, sectionId, lineItemId);
  const currentSnapshot = getLineItemSnapshot(currentSections, sectionId, lineItemId);

  if (!savedSnapshot || !currentSnapshot) {
    return false;
  }

  const sectionsWithSavedLineItem = currentSections.map((section) => {
    if (section.id !== sectionId) {
      return section;
    }

    return {
      ...section,
      lineItems: section.lineItems.map((lineItem) =>
        lineItem.id === lineItemId ? savedSnapshot.lineItem : lineItem,
      ),
    };
  });

  return !areSectionsEqual(sectionsWithSavedLineItem, savedSections);
}

function buildUpdateInput(quoteId: string, sections: QuoteSectionRecord[]) {
  return {
    quoteId,
    sections: sections.map((section, sectionIndex) => ({
      id: section.id,
      sourceServicePackageId: section.sourceServicePackageId || undefined,
      title: section.title,
      content: section.content,
      position: sectionIndex + 1,
      lineItems: section.lineItems.map((lineItem, lineItemIndex) => ({
        id: lineItem.id,
        name: lineItem.name,
        content: lineItem.content,
        quantity: lineItem.quantity,
        unitLabel: lineItem.unitLabel,
        unitPriceCents: lineItem.unitPriceCents,
        position: lineItemIndex + 1,
      })),
    })),
  };
}

function useUnsavedChangesGuard(enabled: boolean) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const message =
      "You have unsaved quote changes. Leave this page without saving?";

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = message;
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target && anchor.target !== "_self") {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);
      const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

      if (nextUrl.origin !== window.location.origin || nextPath === currentPath) {
        return;
      }

      event.preventDefault();

      if (window.confirm(message)) {
        router.push(nextPath);
      }
    }

    function handlePopState() {
      if (!window.confirm(message)) {
        window.history.pushState(null, "", window.location.href);
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.href);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled, pathname, router]);
}

function SortableSectionWrapper({
  section,
  children,
}: {
  section: QuoteSectionRecord;
  children: (dragHandleProps: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
  }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}

export function QuoteStructureEditor({
  quoteId,
  initialSections,
  sourcePackageNames,
  clientId,
  backTo,
}: QuoteStructureEditorProps) {
  const initialize = useQuoteEditorStore((state) => state.initialize);
  const savedSections = useQuoteEditorStore((state) => state.initialSections);
  const sections = useQuoteEditorStore((state) => state.sections);
  const hasUnsavedChanges = useQuoteEditorStore(
    (state) => state.hasUnsavedChanges,
  );
  const isReordering = useQuoteEditorStore((state) => state.isReordering);
  const reorderError = useQuoteEditorStore((state) => state.reorderError);
  const updateSectionTitle = useQuoteEditorStore(
    (state) => state.updateSectionTitle,
  );
  const updateSectionContent = useQuoteEditorStore(
    (state) => state.updateSectionContent,
  );
  const updateLineItemField = useQuoteEditorStore(
    (state) => state.updateLineItemField,
  );
  const reorderSectionsStore = useQuoteEditorStore(
    (state) => state.reorderSections,
  );
  const reorderLineItemsStore = useQuoteEditorStore(
    (state) => state.reorderLineItems,
  );
  const revertSection = useQuoteEditorStore((state) => state.revertSection);
  const revertLineItem = useQuoteEditorStore((state) => state.revertLineItem);
  const markSaved = useQuoteEditorStore((state) => state.markSaved);
  const startReordering = useQuoteEditorStore((state) => state.startReordering);
  const finishReordering = useQuoteEditorStore((state) => state.finishReordering);
  const setReorderError = useQuoteEditorStore((state) => state.setReorderError);
  const router = useRouter();
  const [isSaving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    initialize(initialSections);
  }, [initialSections, initialize]);

  const saveInput = useMemo(
    () => buildUpdateInput(quoteId, sections),
    [quoteId, sections],
  );

  const validationErrors = useMemo(() => {
    const parsed = updateQuoteSectionsSchema.safeParse(saveInput);

    if (parsed.success) {
      return {};
    }

    return getUpdateQuoteSectionsFieldErrors(parsed.error);
  }, [saveInput]);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const grandTotal = calculateQuoteTotalCents(sections);
  const savedGrandTotal = calculateQuoteTotalCents(initialSections);
  const totalDelta = grandTotal - savedGrandTotal;
  const totalLineItems = sections.reduce(
    (sum, s) => sum + s.lineItems.length,
    0,
  );
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const readinessIssues = useMemo(
    () => computeReadinessIssues(sections, clientId),
    [sections, clientId],
  );
  const isPreviewReady = readinessIssues.length === 0;
  const previewHref = useMemo(
    () => buildQuotePreviewHref(quoteId, backTo),
    [backTo, quoteId],
  );

  useUnsavedChangesGuard(hasUnsavedChanges);

  function handlePersistedSections(
    nextSections: QuoteSectionRecord[],
    message: string,
  ) {
    markSaved(nextSections);
    finishReordering();
    setReorderError(null);
    setError(null);
    setSuccessMessage(message);
  }

  function clearMessages() {
    setError(null);
    setSuccessMessage(null);
    setReorderError(null);
  }

  async function persistDraftIfNeeded(options?: { silent?: boolean }) {
    if (!hasUnsavedChanges) {
      return true;
    }

    if (hasValidationErrors) {
      setError("Fix the highlighted fields before saving this quote draft.");
      return false;
    }

    const result = await updateQuoteSections(saveInput);

    if (!result.ok) {
      setError(result.error.message);
      return false;
    }

    markSaved(result.data.quote.sections);

    if (!options?.silent) {
      setSuccessMessage("Quote draft saved successfully.");
    }

    return true;
  }

  function handleSectionTitleChange(sectionId: string, title: string) {
    clearMessages();
    updateSectionTitle(sectionId, title);
  }

  function handleSectionContentChange(sectionId: string, content: string) {
    clearMessages();
    updateSectionContent(sectionId, content);
  }

  function handleLineItemChange(
    sectionId: string,
    lineItemId: string,
    field: "name" | "content" | "quantity" | "unitLabel" | "unitPriceCents",
    value: string | number,
  ) {
    clearMessages();
    updateLineItemField(sectionId, lineItemId, field, value);
  }

  function handleSave() {
    if (hasValidationErrors) {
      setError("Fix the highlighted fields before saving this quote draft.");
      setSuccessMessage(null);
      return;
    }

    clearMessages();

    startSave(async () => {
      const result = await updateQuoteSections(saveInput);

      if (result.ok) {
        handlePersistedSections(
          result.data.quote.sections,
          "Quote draft saved successfully.",
        );
      } else {
        setError(result.error.message);
      }
    });
  }

  function handleAddSection() {
    clearMessages();

    startSave(async () => {
      const persisted = await persistDraftIfNeeded({ silent: true });

      if (!persisted) {
        return;
      }

      const result = await addQuoteSection(quoteId);

      if (result.ok) {
        handlePersistedSections(result.data.quote.sections, "Section added.");
      } else {
        setError(result.error.message);
      }
    });
  }

  function handleRemoveSection(sectionId: string) {
    clearMessages();

    startSave(async () => {
      const persisted = await persistDraftIfNeeded({ silent: true });

      if (!persisted) {
        return;
      }

      const result = await removeQuoteSection(quoteId, sectionId);

      if (result.ok) {
        handlePersistedSections(result.data.quote.sections, "Section removed.");
      } else {
        setError(result.error.message);
      }
    });
  }

  function handleAddLineItem(sectionId: string) {
    clearMessages();

    startSave(async () => {
      const persisted = await persistDraftIfNeeded({ silent: true });

      if (!persisted) {
        return;
      }

      const result = await addQuoteLineItem(quoteId, sectionId);

      if (result.ok) {
        handlePersistedSections(result.data.quote.sections, "Line item added.");
      } else {
        setError(result.error.message);
      }
    });
  }

  function handleRemoveLineItem(sectionId: string, lineItemId: string) {
    clearMessages();

    startSave(async () => {
      const persisted = await persistDraftIfNeeded({ silent: true });

      if (!persisted) {
        return;
      }

      const result = await removeQuoteLineItem(quoteId, sectionId, lineItemId);

      if (result.ok) {
        handlePersistedSections(result.data.quote.sections, "Line item removed.");
      } else {
        setError(result.error.message);
      }
    });
  }

  function persistReorder(
    newSectionIds: string[],
    previousIds: string[],
    message: string,
  ) {
    clearMessages();

    startSave(async () => {
      const persisted = await persistDraftIfNeeded({ silent: true });

      if (!persisted) {
        return;
      }

      reorderSectionsStore(newSectionIds);
      startReordering();

      const result = await reorderQuoteSections(quoteId, newSectionIds);

      if (result.ok) {
        handlePersistedSections(result.data.quote.sections, message);
      } else {
        reorderSectionsStore(previousIds);
        setReorderError(result.error.message);
        setError(result.error.message);
      }
    });
  }

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sectionIds.indexOf(active.id as string);
    const newIndex = sectionIds.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newSectionIds = [...sectionIds];
    newSectionIds.splice(oldIndex, 1);
    newSectionIds.splice(newIndex, 0, active.id as string);

    persistReorder(newSectionIds, sectionIds, "Sections reordered.");
  }

  function handleMoveSectionUp(sectionId: string) {
    const index = sectionIds.indexOf(sectionId);
    if (index <= 0) return;

    const newSectionIds = [...sectionIds];
    [newSectionIds[index - 1], newSectionIds[index]] = [
      newSectionIds[index],
      newSectionIds[index - 1],
    ];

    persistReorder(newSectionIds, sectionIds, "Section moved.");
  }

  function handleMoveSectionDown(sectionId: string) {
    const index = sectionIds.indexOf(sectionId);
    if (index === -1 || index >= sectionIds.length - 1) return;

    const newSectionIds = [...sectionIds];
    [newSectionIds[index], newSectionIds[index + 1]] = [
      newSectionIds[index + 1],
      newSectionIds[index],
    ];

    persistReorder(newSectionIds, sectionIds, "Section moved.");
  }

  function persistLineItemReorder(
    sectionId: string,
    newItemIds: string[],
    previousItemIds: string[],
    message: string,
  ) {
    clearMessages();

    startSave(async () => {
      const persisted = await persistDraftIfNeeded({ silent: true });

      if (!persisted) {
        return;
      }

      reorderLineItemsStore(sectionId, newItemIds);
      startReordering();

      const result = await reorderQuoteLineItems(quoteId, sectionId, newItemIds);

      if (result.ok) {
        handlePersistedSections(result.data.quote.sections, message);
      } else {
        reorderLineItemsStore(sectionId, previousItemIds);
        setReorderError(result.error.message);
        setError(result.error.message);
      }
    });
  }

  function handleMoveLineItemUp(sectionId: string, lineItemId: string) {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const itemIds = section.lineItems.map((li) => li.id);
    const index = itemIds.indexOf(lineItemId);
    if (index <= 0) return;

    const newItemIds = [...itemIds];
    [newItemIds[index - 1], newItemIds[index]] = [
      newItemIds[index],
      newItemIds[index - 1],
    ];

    persistLineItemReorder(sectionId, newItemIds, itemIds, "Line item moved.");
  }

  function handleMoveLineItemDown(sectionId: string, lineItemId: string) {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const itemIds = section.lineItems.map((li) => li.id);
    const index = itemIds.indexOf(lineItemId);
    if (index === -1 || index >= itemIds.length - 1) return;

    const newItemIds = [...itemIds];
    [newItemIds[index], newItemIds[index + 1]] = [
      newItemIds[index + 1],
      newItemIds[index],
    ];

    persistLineItemReorder(sectionId, newItemIds, itemIds, "Line item moved.");
  }

  function handleReorderLineItems(sectionId: string, lineItemIds: string[]) {
    const section = sections.find((candidate) => candidate.id === sectionId);

    if (!section) {
      return;
    }

    const previousItemIds = section.lineItems.map((lineItem) => lineItem.id);

    if (lineItemIds.join(":") === previousItemIds.join(":")) {
      return;
    }

    persistLineItemReorder(
      sectionId,
      lineItemIds,
      previousItemIds,
      "Line items reordered.",
    );
  }

  function handleLineItemBlur(sectionId: string, lineItemId: string) {
    const currentSnapshot = getLineItemSnapshot(sections, sectionId, lineItemId);
    const savedSnapshot = getLineItemSnapshot(savedSections, sectionId, lineItemId);

    if (!currentSnapshot || !savedSnapshot) {
      return;
    }

    if (
      JSON.stringify(currentSnapshot.lineItem) === JSON.stringify(savedSnapshot.lineItem)
    ) {
      return;
    }

    clearMessages();

    startSave(async () => {
      if (hasOtherUnsavedChanges(sections, savedSections, sectionId, lineItemId)) {
        const persisted = await persistDraftIfNeeded({ silent: true });

        if (persisted) {
          setSuccessMessage("Quote draft saved successfully.");
        }

        return;
      }

      const latestSnapshot = getLineItemSnapshot(sections, sectionId, lineItemId);

      if (!latestSnapshot) {
        return;
      }

      const result = await updateQuoteLineItem(
        quoteId,
        sectionId,
        lineItemId,
        latestSnapshot.lineItem.name,
        latestSnapshot.lineItem.content,
        latestSnapshot.lineItem.quantity,
        latestSnapshot.lineItem.unitLabel,
        latestSnapshot.lineItem.unitPriceCents,
      );

      if (result.ok) {
        handlePersistedSections(result.data.quote.sections, "Line item saved.");
      } else {
        setError(result.error.message);
      }
    });
  }

  function handleOpenPreview() {
    if (!isPreviewReady) {
      return;
    }

    clearMessages();

    startSave(async () => {
      const persisted = await persistDraftIfNeeded({ silent: true });

      if (!persisted) {
        return;
      }

      router.push(previewHref);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Quote editor ({sections.length} sections, {totalLineItems} items)
          </p>
          {hasUnsavedChanges ? (
            <p className="text-sm text-amber-700">Unsaved changes are being tracked.</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenPreview}
            disabled={!isPreviewReady || isSaving}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              isPreviewReady
                ? "bg-green-600 text-white hover:bg-green-700"
                : "cursor-not-allowed bg-zinc-200 text-zinc-500"
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || hasValidationErrors}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save draft"}
          </button>
        </div>
      </div>

      {hasValidationErrors ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Fix the highlighted fields before saving this quote draft.
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900"
        >
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          <p className="font-semibold">Save failed</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}

      {isReordering ? (
        <div
          role="status"
          className="rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-700"
        >
          Reordering quote content...
        </div>
      ) : null}

      {reorderError ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {reorderError}
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext
          items={sectionIds}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section, sectionIndex) => (
            <SortableSectionWrapper key={section.id} section={section}>
              {({ attributes, listeners }) => (
                <div className="flex items-start gap-2">
                  <div className="flex flex-col items-center gap-1 pt-5">
                    <button
                      type="button"
                      className="cursor-grab rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 active:cursor-grabbing"
                      aria-label="Drag to reorder section"
                      {...attributes}
                      {...listeners}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="5" cy="3" r="1.5" />
                        <circle cx="11" cy="3" r="1.5" />
                        <circle cx="5" cy="8" r="1.5" />
                        <circle cx="11" cy="8" r="1.5" />
                        <circle cx="5" cy="13" r="1.5" />
                        <circle cx="11" cy="13" r="1.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSectionUp(section.id)}
                      disabled={isSaving || sectionIndex === 0}
                      className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Move section up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSectionDown(section.id)}
                      disabled={isSaving || sectionIndex === sections.length - 1}
                      className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Move section down"
                    >
                      ↓
                    </button>
                  </div>
                  <div className="flex-1">
                    <QuoteEditorSection
                      section={section}
                      sectionIndex={sectionIndex}
                      sourcePackageName={
                        sourcePackageNames[section.sourceServicePackageId]
                      }
                      fieldErrors={validationErrors}
                      onTitleChange={handleSectionTitleChange}
                      onContentChange={handleSectionContentChange}
                      onLineItemChange={handleLineItemChange}
                      onRemoveSection={handleRemoveSection}
                      onAddLineItem={handleAddLineItem}
                      onRemoveLineItem={handleRemoveLineItem}
                      onSaveRequested={handleSave}
                      onResetSection={revertSection}
                      onResetLineItem={revertLineItem}
                      onLineItemBlur={handleLineItemBlur}
                      onMoveLineItemUp={handleMoveLineItemUp}
                      onMoveLineItemDown={handleMoveLineItemDown}
                      onReorderLineItems={handleReorderLineItems}
                      isPending={isSaving}
                    />
                  </div>
                </div>
              )}
            </SortableSectionWrapper>
          ))}
        </SortableContext>
      </DndContext>

      <button
        id="add-section-button"
        type="button"
        onClick={handleAddSection}
        disabled={isSaving}
        className="w-full rounded-lg border-2 border-dashed border-zinc-300 py-3 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        + Add section
      </button>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-zinc-900">Grand total</p>
            <p className="text-xs text-zinc-500">
              {sections.length} sections · {totalLineItems} line items
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-zinc-900">
              {formatCurrencyFromCents(grandTotal)}
            </p>
            {totalDelta !== 0 ? (
              <p
                className={`text-xs font-medium ${
                  totalDelta > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalDelta > 0 ? "+" : ""}
                {formatCurrencyFromCents(totalDelta)} from saved
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <PreviewReadinessIndicator
        sections={sections}
        clientId={clientId}
        previewHref={previewHref}
        onOpenPreview={handleOpenPreview}
        isPreviewPending={isSaving}
      />
    </div>
  );
}
