"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { QuoteEditorSection } from "@/features/quotes/components/quote-editor-section";
import { addQuoteSection } from "@/features/quotes/server/actions/add-quote-section";
import { removeQuoteSection } from "@/features/quotes/server/actions/remove-quote-section";
import { addQuoteLineItem } from "@/features/quotes/server/actions/add-quote-line-item";
import { removeQuoteLineItem } from "@/features/quotes/server/actions/remove-quote-line-item";
import { updateQuoteSections } from "@/features/quotes/server/actions/update-quote-sections";
import {
  getUpdateQuoteSectionsFieldErrors,
  updateQuoteSectionsSchema,
} from "@/features/quotes/schemas/update-quote-sections-schema";
import { useQuoteEditorStore } from "@/features/quotes/store/quote-editor-store";
import type { QuoteSectionRecord } from "@/features/quotes/types";
import { calculateQuoteTotalCents } from "@/features/quotes/types";

type QuoteStructureEditorProps = {
  quoteId: string;
  initialSections: QuoteSectionRecord[];
  sourcePackageNames: Record<string, string>;
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  }).format(cents / 100);
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

export function QuoteStructureEditor({
  quoteId,
  initialSections,
  sourcePackageNames,
}: QuoteStructureEditorProps) {
  const initialize = useQuoteEditorStore((state) => state.initialize);
  const sections = useQuoteEditorStore((state) => state.sections);
  const hasUnsavedChanges = useQuoteEditorStore(
    (state) => state.hasUnsavedChanges,
  );
  const updateSectionTitle = useQuoteEditorStore(
    (state) => state.updateSectionTitle,
  );
  const updateSectionContent = useQuoteEditorStore(
    (state) => state.updateSectionContent,
  );
  const updateLineItemField = useQuoteEditorStore(
    (state) => state.updateLineItemField,
  );
  const revertSection = useQuoteEditorStore((state) => state.revertSection);
  const revertLineItem = useQuoteEditorStore((state) => state.revertLineItem);
  const markSaved = useQuoteEditorStore((state) => state.markSaved);
  const [isSaving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
  useUnsavedChangesGuard(hasUnsavedChanges);

  function handleSectionTitleChange(sectionId: string, title: string) {
    setError(null);
    setSuccessMessage(null);
    updateSectionTitle(sectionId, title);
  }

  function handleSectionContentChange(sectionId: string, content: string) {
    setError(null);
    setSuccessMessage(null);
    updateSectionContent(sectionId, content);
  }

  function handleLineItemChange(
    sectionId: string,
    lineItemId: string,
    field: "name" | "content" | "quantity" | "unitLabel" | "unitPriceCents",
    value: string | number,
  ) {
    setError(null);
    setSuccessMessage(null);
    updateLineItemField(sectionId, lineItemId, field, value);
  }

  function handlePersistedSections(
    nextSections: QuoteSectionRecord[],
    message: string,
  ) {
    markSaved(nextSections);
    setError(null);
    setSuccessMessage(message);
  }

  function handleSave() {
    if (hasValidationErrors) {
      setError("Fix the highlighted fields before saving this quote draft.");
      setSuccessMessage(null);
      return;
    }

    setError(null);
    setSuccessMessage(null);

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
    setError(null);
    setSuccessMessage(null);

    startSave(async () => {
      const result = await addQuoteSection(quoteId);

      if (result.ok) {
        handlePersistedSections(result.data.quote.sections, "Section added.");
      } else {
        setError(result.error.message);
      }
    });
  }

  function handleRemoveSection(sectionId: string) {
    setError(null);
    setSuccessMessage(null);

    startSave(async () => {
      const result = await removeQuoteSection(quoteId, sectionId);

      if (result.ok) {
        handlePersistedSections(result.data.quote.sections, "Section removed.");
      } else {
        setError(result.error.message);
      }
    });
  }

  function handleAddLineItem(sectionId: string) {
    setError(null);
    setSuccessMessage(null);

    startSave(async () => {
      const result = await addQuoteLineItem(quoteId, sectionId);

      if (result.ok) {
        handlePersistedSections(result.data.quote.sections, "Line item added.");
      } else {
        setError(result.error.message);
      }
    });
  }

  function handleRemoveLineItem(sectionId: string, lineItemId: string) {
    setError(null);
    setSuccessMessage(null);

    startSave(async () => {
      const result = await removeQuoteLineItem(quoteId, sectionId, lineItemId);

      if (result.ok) {
        handlePersistedSections(result.data.quote.sections, "Line item removed.");
      } else {
        setError(result.error.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Quote editor ({sections.length} sections)
          </p>
          {hasUnsavedChanges ? (
            <p className="text-sm text-amber-700">Unsaved changes are being tracked.</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || hasValidationErrors}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save draft"}
        </button>
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

      {sections.map((section, sectionIndex) => (
        <QuoteEditorSection
          key={section.id}
          section={section}
          sectionIndex={sectionIndex}
          sourcePackageName={sourcePackageNames[section.sourceServicePackageId]}
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
          isPending={isSaving}
        />
      ))}

      <button
        type="button"
        onClick={handleAddSection}
        disabled={isSaving}
        className="w-full rounded-lg border-2 border-dashed border-zinc-300 py-3 text-sm font-medium text-zinc-600 hover:border-zinc-400 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        + Add section
      </button>

      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
        <p className="text-base font-semibold text-zinc-900">Grand total</p>
        <p className="text-lg font-bold text-zinc-900">
          {formatCents(grandTotal)}
        </p>
      </div>
    </div>
  );
}
