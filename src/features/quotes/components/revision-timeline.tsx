"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyFromCents } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/dates";

import type { QuoteRevisionRecord, QuoteSectionRecord } from "@/features/quotes/types";
import { calculateQuoteTotalCents } from "@/features/quotes/types";

type CurrentVersion = {
  title: string;
  terms: string;
  updatedAt: string;
  sections: QuoteSectionRecord[];
};

type RevisionTimelineProps = {
  revisions: QuoteRevisionRecord[];
  currentVersion: CurrentVersion;
};

type VersionDetailPanelProps = {
  panelLabel: string;
  heading: string;
  description: string;
  title: string;
  terms: string;
  sections: QuoteSectionRecord[];
  emptyMessage: string;
  dismissLabel?: string;
  dismissButtonRef?: RefObject<HTMLButtonElement | null>;
  onDismiss?: () => void;
};

function calculateSectionTotal(section: QuoteSectionRecord): number {
  return section.lineItems.reduce((total, lineItem) => total + lineItem.lineTotalCents, 0);
}

function VersionDetailPanel({
  panelLabel,
  heading,
  description,
  title,
  terms,
  sections,
  emptyMessage,
  dismissLabel,
  dismissButtonRef,
  onDismiss,
}: VersionDetailPanelProps) {
  const grandTotal = calculateQuoteTotalCents(sections);

  return (
    <Card aria-label={panelLabel} className="border-zinc-200">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{heading}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {onDismiss && dismissLabel ? (
          <button
            ref={dismissButtonRef}
            type="button"
            onClick={onDismiss}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            {dismissLabel}
          </button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {title ? (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Title</p>
            <p className="text-sm text-zinc-900">{title}</p>
          </div>
        ) : null}

        {terms ? (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Terms</p>
            <p className="text-sm text-zinc-900">{terms}</p>
          </div>
        ) : null}

        {sections.length > 0 ? (
          <div className="space-y-4">
            {sections.map((section) => {
              const sectionTotal = calculateSectionTotal(section);

              return (
                <Card key={section.id} className="border-zinc-200 shadow-none">
                  <CardHeader className="space-y-1.5 pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-sm">{section.title}</CardTitle>
                        {section.content ? (
                          <CardDescription className="mt-1 text-xs">
                            {section.content}
                          </CardDescription>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {formatCurrencyFromCents(sectionTotal)}
                      </p>
                    </div>
                  </CardHeader>

                  {section.lineItems.length > 0 ? (
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-0">Item</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="pr-0 text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {section.lineItems.map((lineItem) => (
                            <TableRow key={lineItem.id}>
                              <TableCell className="pl-0">
                                <p className="font-medium text-zinc-900">{lineItem.name}</p>
                                {lineItem.content ? (
                                  <p className="text-xs text-zinc-500">{lineItem.content}</p>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-zinc-700">{lineItem.quantity}</TableCell>
                              <TableCell className="text-zinc-700">
                                {lineItem.unitLabel || "-"}
                              </TableCell>
                              <TableCell className="text-right text-zinc-700">
                                {formatCurrencyFromCents(lineItem.unitPriceCents)}
                              </TableCell>
                              <TableCell className="pr-0 text-right font-medium text-zinc-900">
                                {formatCurrencyFromCents(lineItem.lineTotalCents)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  ) : null}
                </Card>
              );
            })}

            <Card className="border-zinc-200 bg-zinc-50 shadow-none">
              <CardContent className="flex items-center justify-between px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">Grand total</p>
                <p className="text-base font-bold text-zinc-900">
                  {formatCurrencyFromCents(grandTotal)}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function RevisionTimeline({ revisions, currentVersion }: RevisionTimelineProps) {
  const [selectedRevisionIndex, setSelectedRevisionIndex] = useState<number | null>(null);
  const revisionButtonRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const dismissButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastTriggerRevisionIdRef = useRef<string | null>(null);
  const focusTargetRevisionIdRef = useRef<string | null>(null);

  const hasRevisions = revisions.length > 0;
  const selectedRevision =
    selectedRevisionIndex !== null ? revisions[selectedRevisionIndex] ?? null : null;

  useEffect(() => {
    if (selectedRevisionIndex !== null) {
      return;
    }

    const revisionId = focusTargetRevisionIdRef.current;

    if (!revisionId) {
      return;
    }

    focusTargetRevisionIdRef.current = null;
    revisionButtonRefs.current.get(revisionId)?.focus();
  }, [selectedRevisionIndex]);

  const dismissSelectedRevision = useCallback(() => {
    const revisionId = lastTriggerRevisionIdRef.current;

    setSelectedRevisionIndex(null);
    focusTargetRevisionIdRef.current = revisionId;
  }, []);

  useEffect(() => {
    if (!selectedRevision) {
      return;
    }

    dismissButtonRef.current?.focus();
  }, [selectedRevision]);

  useEffect(() => {
    if (!selectedRevision) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      dismissSelectedRevision();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismissSelectedRevision, selectedRevision]);

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
          Revision history
        </h3>
        <p className="mt-1 text-sm text-zinc-600">
          Review the current working quote and the preserved prior versions.
        </p>
      </div>

      {!hasRevisions ? (
        <Card className="border-dashed border-zinc-300 text-center shadow-none">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-600">
              No previous revisions yet. Save a revision to start tracking changes.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <ol className="space-y-3">
        <li>
          <button
            type="button"
            onClick={() => setSelectedRevisionIndex(null)}
            className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
              selectedRevisionIndex === null
                ? "border-blue-200 bg-blue-50"
                : "border-zinc-200 bg-white hover:bg-zinc-50"
            }`}
            aria-current="step"
          >
            <div>
              <p className="text-sm font-semibold text-zinc-900">Current version</p>
              <p className="text-sm text-blue-900">Current working version</p>
              <p className="text-xs text-zinc-500">Updated {formatDate(currentVersion.updatedAt)}</p>
            </div>
            <span
              className="rounded-md border border-blue-300 bg-blue-100 px-3 py-2 text-sm font-medium text-blue-800"
              aria-label="Current version"
            >
              Current
            </span>
          </button>
        </li>

        {revisions.map((revision, index) => (
          <li key={revision.id}>
            <button
              ref={(node) => {
                revisionButtonRefs.current.set(revision.id, node);
              }}
              type="button"
              onClick={() => {
                lastTriggerRevisionIdRef.current = revision.id;
                setSelectedRevisionIndex(index);
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                selectedRevisionIndex === index
                  ? "border-blue-200 bg-blue-50"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
              }`}
              aria-label={`View revision ${revision.revisionNumber}`}
              aria-pressed={selectedRevisionIndex === index}
            >
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Revision {revision.revisionNumber}
                </p>
                <p className="text-sm text-zinc-600">Saved {formatDate(revision.createdAt)}</p>
              </div>
              <span
                className={`rounded-md border px-3 py-2 text-sm font-medium ${
                  selectedRevisionIndex === index
                    ? "border-blue-300 bg-blue-100 text-blue-800"
                    : "border-zinc-300 text-zinc-700"
                }`}
              >
                {selectedRevisionIndex === index ? "Viewing" : "View"}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {selectedRevision ? (
        <VersionDetailPanel
          panelLabel={`Revision ${selectedRevision.revisionNumber} detail`}
          heading={`Revision ${selectedRevision.revisionNumber} detail`}
          description={`Snapshot saved ${formatDate(selectedRevision.createdAt)}`}
          title={selectedRevision.title}
          terms={selectedRevision.terms}
          sections={selectedRevision.snapshotData.sections}
          emptyMessage="This revision has no sections."
          dismissLabel="Back to current version"
          dismissButtonRef={dismissButtonRef}
          onDismiss={dismissSelectedRevision}
        />
      ) : (
        <VersionDetailPanel
          panelLabel="Current version detail"
          heading="Current version detail"
          description={`Updated ${formatDate(currentVersion.updatedAt)}`}
          title={currentVersion.title}
          terms={currentVersion.terms}
          sections={currentVersion.sections}
          emptyMessage="This version has no sections yet."
        />
      )}
    </section>
  );
}
