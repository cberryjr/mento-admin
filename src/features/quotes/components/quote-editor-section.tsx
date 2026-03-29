"use client";

import { useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Dialog } from "@/components/ui/dialog";
import type { QuoteSectionRecord } from "@/features/quotes/types";
import { formatCurrencyFromCents } from "@/lib/format/currency";
import { cn } from "@/lib/utils/cn";

type QuoteEditorFieldErrors = Record<string, string[]>;
type QuoteLineItemField =
  | "name"
  | "content"
  | "quantity"
  | "unitLabel"
  | "unitPriceCents";

type QuoteEditorSectionProps = {
  section: QuoteSectionRecord;
  sectionIndex: number;
  sourcePackageName?: string;
  fieldErrors: QuoteEditorFieldErrors;
  onTitleChange: (sectionId: string, title: string) => void;
  onContentChange: (sectionId: string, content: string) => void;
  onLineItemChange: (
    sectionId: string,
    lineItemId: string,
    field: QuoteLineItemField,
    value: string | number,
  ) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddLineItem: (sectionId: string) => void;
  onRemoveLineItem: (sectionId: string, lineItemId: string) => void;
  onSaveRequested: () => void;
  onResetSection: (sectionId: string) => void;
  onResetLineItem: (sectionId: string, lineItemId: string) => void;
  onLineItemBlur: (sectionId: string, lineItemId: string) => void;
  onMoveLineItemUp: (sectionId: string, lineItemId: string) => void;
  onMoveLineItemDown: (sectionId: string, lineItemId: string) => void;
  onReorderLineItems: (sectionId: string, lineItemIds: string[]) => void;
  isPending: boolean;
};

function calculateSectionTotal(section: QuoteSectionRecord): number {
  return section.lineItems.reduce((total, li) => total + li.lineTotalCents, 0);
}

function getFirstFieldError(
  fieldErrors: QuoteEditorFieldErrors,
  path: string,
) {
  return fieldErrors[path]?.[0] ?? null;
}

function SortableLineItemRow({
  lineItemId,
  children,
}: {
  lineItemId: string;
  children: (dragHandleProps: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
    isDragging: boolean;
  }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lineItemId });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
      }}
      className={cn(
        "border-b border-zinc-100 last:border-0",
        isDragging && "bg-zinc-50",
      )}
    >
      {children({ attributes, listeners, isDragging })}
    </tr>
  );
}

export function QuoteEditorSection({
  section,
  sectionIndex,
  sourcePackageName,
  fieldErrors,
  onTitleChange,
  onContentChange,
  onLineItemChange,
  onRemoveSection,
  onAddLineItem,
  onRemoveLineItem,
  onSaveRequested,
  onResetSection,
  onResetLineItem,
  onLineItemBlur,
  onMoveLineItemUp,
  onMoveLineItemDown,
  onReorderLineItems,
  isPending,
}: QuoteEditorSectionProps) {
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [lineItemPendingRemoval, setLineItemPendingRemoval] = useState<string | null>(
    null,
  );
  const sectionTotal = calculateSectionTotal(section);
  const lineItemIds = section.lineItems.map((lineItem) => lineItem.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const sectionTitleError = getFirstFieldError(
    fieldErrors,
    `sections.${sectionIndex}.title`,
  );

  function handleFieldKeyDown(
    event: ReactKeyboardEvent,
    onEscape: () => void,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSaveRequested();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onEscape();
    }
  }

  function handleLineItemDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const currentIndex = lineItemIds.indexOf(active.id as string);
    const nextIndex = lineItemIds.indexOf(over.id as string);

    if (currentIndex === -1 || nextIndex === -1) {
      return;
    }

    const reordered = [...lineItemIds];
    reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, active.id as string);

    onReorderLineItems(section.id, reordered);
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <label className="sr-only" htmlFor={`section-title-${section.id}`}>
              Section title
            </label>
            <input
              id={`section-title-${section.id}`}
              type="text"
              value={section.title}
              onChange={(e) => onTitleChange(section.id, e.target.value)}
              onKeyDown={(event) =>
                handleFieldKeyDown(event, () => onResetSection(section.id))
              }
              placeholder="Section title"
              disabled={isPending}
              aria-invalid={sectionTitleError ? true : undefined}
              aria-describedby={
                sectionTitleError ? `section-title-error-${section.id}` : undefined
              }
              className={cn(
                "w-full rounded-md border px-3 py-2 text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 disabled:opacity-60",
                sectionTitleError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500",
              )}
            />
            {sectionTitleError ? (
              <p
                id={`section-title-error-${section.id}`}
                className="text-xs font-medium text-red-600"
              >
                {sectionTitleError}
              </p>
            ) : null}

            <label className="sr-only" htmlFor={`section-content-${section.id}`}>
              Section description
            </label>
            <textarea
              id={`section-content-${section.id}`}
              value={section.content}
              onChange={(e) => onContentChange(section.id, e.target.value)}
              onKeyDown={(event) =>
                handleFieldKeyDown(event, () => onResetSection(section.id))
              }
              placeholder="Section description (optional)"
              disabled={isPending}
              rows={2}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-60"
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900">
              {formatCurrencyFromCents(sectionTotal)}
            </p>
            <button
              type="button"
              onClick={() => setShowSectionDialog(true)}
              disabled={isPending}
              className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-red-600 disabled:opacity-60"
            >
              Remove section
            </button>
          </div>
        </div>

        {section.sourceServicePackageId ? (
          <p className="inline-flex w-fit items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
            Source package: {sourcePackageName ?? section.sourceServicePackageId}
          </p>
        ) : null}

        {section.lineItems.length > 0 ? (
          <div className="mt-3">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleLineItemDragEnd}
            >
              <SortableContext
                items={lineItemIds}
                strategy={verticalListSortingStrategy}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      <th className="w-10 pb-2 pr-2 text-center">Move</th>
                      <th className="pb-2 pr-2">Item</th>
                      <th className="pb-2 pr-2 text-center">Qty</th>
                      <th className="pb-2 pr-2">Unit</th>
                      <th className="pb-2 pr-2 text-right">Unit Price</th>
                      <th className="pb-2 text-right">Total</th>
                      <th className="w-24 pb-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.lineItems.map((lineItem, lineItemIndex) => {
                      const nameError = getFirstFieldError(
                        fieldErrors,
                        `sections.${sectionIndex}.lineItems.${lineItemIndex}.name`,
                      );
                      const quantityError = getFirstFieldError(
                        fieldErrors,
                        `sections.${sectionIndex}.lineItems.${lineItemIndex}.quantity`,
                      );
                      const unitPriceError = getFirstFieldError(
                        fieldErrors,
                        `sections.${sectionIndex}.lineItems.${lineItemIndex}.unitPriceCents`,
                      );

                      return (
                        <SortableLineItemRow key={lineItem.id} lineItemId={lineItem.id}>
                          {({ attributes, listeners, isDragging }) => (
                            <>
                              <td className="py-2 pr-2 text-center align-top">
                                <button
                                  type="button"
                                  className={cn(
                                    "cursor-grab rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 active:cursor-grabbing",
                                    isDragging && "bg-zinc-100 text-zinc-700",
                                  )}
                                  aria-label="Drag to reorder line item"
                                  disabled={isPending}
                                  {...attributes}
                                  {...listeners}
                                >
                                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                    <circle cx="5" cy="3" r="1.5" />
                                    <circle cx="11" cy="3" r="1.5" />
                                    <circle cx="5" cy="8" r="1.5" />
                                    <circle cx="11" cy="8" r="1.5" />
                                    <circle cx="5" cy="13" r="1.5" />
                                    <circle cx="11" cy="13" r="1.5" />
                                  </svg>
                                </button>
                              </td>
                              <td className="py-2 pr-2 align-top">
                                <label className="sr-only" htmlFor={`line-item-name-${lineItem.id}`}>
                                  Line item name
                                </label>
                                <input
                                  id={`line-item-name-${lineItem.id}`}
                                  type="text"
                                  value={lineItem.name}
                                  onChange={(e) =>
                                    onLineItemChange(
                                      section.id,
                                      lineItem.id,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  onBlur={() => onLineItemBlur(section.id, lineItem.id)}
                                  onKeyDown={(event) =>
                                    handleFieldKeyDown(event, () =>
                                      onResetLineItem(section.id, lineItem.id),
                                    )
                                  }
                                  placeholder="Item name"
                                  disabled={isPending}
                                  aria-invalid={nameError ? true : undefined}
                                  aria-describedby={
                                    nameError
                                      ? `line-item-name-error-${lineItem.id}`
                                      : undefined
                                  }
                                  className={cn(
                                    "w-full rounded border px-1 py-0.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none disabled:opacity-60",
                                    nameError
                                      ? "border-red-500 bg-red-50 focus:border-red-500"
                                      : "border-transparent hover:border-zinc-300 focus:border-zinc-500",
                                  )}
                                />
                                {nameError ? (
                                  <p
                                    id={`line-item-name-error-${lineItem.id}`}
                                    className="mt-1 text-xs font-medium text-red-600"
                                  >
                                    {nameError}
                                  </p>
                                ) : null}

                                <label className="sr-only" htmlFor={`line-item-content-${lineItem.id}`}>
                                  Line item description
                                </label>
                                <input
                                  id={`line-item-content-${lineItem.id}`}
                                  type="text"
                                  value={lineItem.content}
                                  onChange={(e) =>
                                    onLineItemChange(
                                      section.id,
                                      lineItem.id,
                                      "content",
                                      e.target.value,
                                    )
                                  }
                                  onBlur={() => onLineItemBlur(section.id, lineItem.id)}
                                  onKeyDown={(event) =>
                                    handleFieldKeyDown(event, () =>
                                      onResetLineItem(section.id, lineItem.id),
                                    )
                                  }
                                  placeholder="Description"
                                  disabled={isPending}
                                  className="w-full rounded border border-transparent px-1 py-0.5 text-xs text-zinc-700 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-500 focus:outline-none disabled:opacity-60"
                                />
                              </td>
                              <td className="py-2 pr-2 text-center align-top">
                                <label className="sr-only" htmlFor={`line-item-quantity-${lineItem.id}`}>
                                  Quantity
                                </label>
                                <input
                                  id={`line-item-quantity-${lineItem.id}`}
                                  type="number"
                                  min={1}
                                  value={lineItem.quantity}
                                  onChange={(e) =>
                                    onLineItemChange(
                                      section.id,
                                      lineItem.id,
                                      "quantity",
                                      parseInt(e.target.value, 10) || 1,
                                    )
                                  }
                                  onBlur={() => onLineItemBlur(section.id, lineItem.id)}
                                  onKeyDown={(event) =>
                                    handleFieldKeyDown(event, () =>
                                      onResetLineItem(section.id, lineItem.id),
                                    )
                                  }
                                  disabled={isPending}
                                  aria-invalid={quantityError ? true : undefined}
                                  aria-describedby={
                                    quantityError
                                      ? `line-item-quantity-error-${lineItem.id}`
                                      : undefined
                                  }
                                  className={cn(
                                    "w-16 rounded border px-1 py-0.5 text-center text-sm text-zinc-900 focus:outline-none disabled:opacity-60",
                                    quantityError
                                      ? "border-red-500 bg-red-50 focus:border-red-500"
                                      : "border-transparent hover:border-zinc-300 focus:border-zinc-500",
                                  )}
                                />
                                {quantityError ? (
                                  <p
                                    id={`line-item-quantity-error-${lineItem.id}`}
                                    className="mt-1 text-xs font-medium text-red-600"
                                  >
                                    {quantityError}
                                  </p>
                                ) : null}
                              </td>
                              <td className="py-2 pr-2 align-top">
                                <label className="sr-only" htmlFor={`line-item-unit-${lineItem.id}`}>
                                  Unit label
                                </label>
                                <input
                                  id={`line-item-unit-${lineItem.id}`}
                                  type="text"
                                  value={lineItem.unitLabel}
                                  onChange={(e) =>
                                    onLineItemChange(
                                      section.id,
                                      lineItem.id,
                                      "unitLabel",
                                      e.target.value,
                                    )
                                  }
                                  onBlur={() => onLineItemBlur(section.id, lineItem.id)}
                                  onKeyDown={(event) =>
                                    handleFieldKeyDown(event, () =>
                                      onResetLineItem(section.id, lineItem.id),
                                    )
                                  }
                                  placeholder="Unit"
                                  disabled={isPending}
                                  className="w-full rounded border border-transparent px-1 py-0.5 text-sm text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-500 focus:outline-none disabled:opacity-60"
                                />
                              </td>
                              <td className="py-2 pr-2 text-right align-top">
                                <label className="sr-only" htmlFor={`line-item-price-${lineItem.id}`}>
                                  Unit price in dollars
                                </label>
                                <input
                                  id={`line-item-price-${lineItem.id}`}
                                  type="number"
                                  min={0}
                                  value={Math.round(lineItem.unitPriceCents / 100)}
                                  onChange={(e) =>
                                    onLineItemChange(
                                      section.id,
                                      lineItem.id,
                                      "unitPriceCents",
                                      (parseInt(e.target.value, 10) || 0) * 100,
                                    )
                                  }
                                  onBlur={() => onLineItemBlur(section.id, lineItem.id)}
                                  onKeyDown={(event) =>
                                    handleFieldKeyDown(event, () =>
                                      onResetLineItem(section.id, lineItem.id),
                                    )
                                  }
                                  disabled={isPending}
                                  aria-invalid={unitPriceError ? true : undefined}
                                  aria-describedby={
                                    unitPriceError
                                      ? `line-item-price-error-${lineItem.id}`
                                      : undefined
                                  }
                                  className={cn(
                                    "w-20 rounded border px-1 py-0.5 text-right text-sm text-zinc-900 focus:outline-none disabled:opacity-60",
                                    unitPriceError
                                      ? "border-red-500 bg-red-50 focus:border-red-500"
                                      : "border-transparent hover:border-zinc-300 focus:border-zinc-500",
                                  )}
                                />
                                {unitPriceError ? (
                                  <p
                                    id={`line-item-price-error-${lineItem.id}`}
                                    className="mt-1 text-xs font-medium text-red-600"
                                  >
                                    {unitPriceError}
                                  </p>
                                ) : null}
                              </td>
                              <td className="py-2 text-right font-medium text-zinc-900 align-top">
                                {formatCurrencyFromCents(lineItem.lineTotalCents)}
                              </td>
                              <td className="py-2 text-center align-top">
                                <div className="flex items-center justify-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => onMoveLineItemUp(section.id, lineItem.id)}
                                    disabled={isPending || lineItemIndex === 0}
                                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Move line item up"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onMoveLineItemDown(section.id, lineItem.id)}
                                    disabled={
                                      isPending || lineItemIndex === section.lineItems.length - 1
                                    }
                                    className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label="Move line item down"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setLineItemPendingRemoval(lineItem.id)}
                                    disabled={isPending}
                                    className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                                    aria-label={`Remove line item ${lineItem.name || ""}`.trim()}
                                  >
                                    &times;
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </SortableLineItemRow>
                      );
                    })}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => onAddLineItem(section.id)}
          disabled={isPending}
          className="mt-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:opacity-60"
        >
          + Add line item
        </button>
      </div>

      <Dialog
        open={showSectionDialog}
        title="Remove this section?"
        description="This will delete the section and every line item inside it from the quote draft."
        confirmLabel="Remove section"
        tone="danger"
        isPending={isPending}
        onClose={() => setShowSectionDialog(false)}
        onConfirm={() => {
          onRemoveSection(section.id);
          setShowSectionDialog(false);
        }}
      />

      <Dialog
        open={lineItemPendingRemoval !== null}
        title="Remove this line item?"
        description="This deletes the line item from the draft quote and recalculates the totals immediately."
        confirmLabel="Remove line item"
        tone="danger"
        isPending={isPending}
        onClose={() => setLineItemPendingRemoval(null)}
        onConfirm={() => {
          if (lineItemPendingRemoval) {
            onRemoveLineItem(section.id, lineItemPendingRemoval);
          }

          setLineItemPendingRemoval(null);
        }}
      />
    </section>
  );
}
