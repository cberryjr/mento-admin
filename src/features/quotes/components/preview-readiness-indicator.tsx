"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { computeReadinessIssues } from "@/features/quotes/lib/preview-readiness";
import type { QuoteSectionRecord } from "@/features/quotes/types";

type PreviewReadinessIndicatorProps = {
  sections: QuoteSectionRecord[];
  clientId: string;
  previewHref?: string;
  onOpenPreview?: () => void;
  isPreviewPending?: boolean;
};

export function PreviewReadinessIndicator({
  sections,
  clientId,
  previewHref,
  onOpenPreview,
  isPreviewPending = false,
}: PreviewReadinessIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  const issues = useMemo(
    () => computeReadinessIssues(sections, clientId),
    [sections, clientId],
  );

  const isReady = issues.length === 0;

  return (
    <div
      className={`rounded-xl border px-5 py-4 ${
        isReady
          ? "border-green-300 bg-green-50"
          : "border-amber-300 bg-amber-50"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              isReady ? "bg-green-500" : "bg-amber-500"
            }`}
          />
          <p
            className={`text-sm font-semibold ${
              isReady ? "text-green-900" : "text-amber-900"
            }`}
          >
            {isReady
              ? "Ready for preview"
              : `${issues.length} item${issues.length === 1 ? "" : "s"} need attention`}
          </p>
        </div>
        {!isReady ? (
          <span className="text-xs text-amber-700">
            {expanded ? "Hide" : "Show"}
          </span>
        ) : null}
      </button>

      {isReady && previewHref ? (
        <div className="mt-3">
          {onOpenPreview ? (
            <button
              type="button"
              onClick={onOpenPreview}
              disabled={isPreviewPending}
              className="inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Open preview
            </button>
          ) : (
            <Link
              href={previewHref}
              className="inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              Open preview
            </Link>
          )}
        </div>
      ) : null}

      {!isReady && expanded ? (
        <ul className="mt-3 space-y-1.5">
          {issues.map((issue, index) => (
            <li key={index} className="text-xs text-amber-800">
              {issue.targetId ? (
                <button
                  type="button"
                  onClick={() => {
                    const el = issue.targetId
                      ? document.getElementById(issue.targetId)
                      : null;
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    el?.focus();
                  }}
                  className="underline decoration-amber-400 underline-offset-2 hover:text-amber-900"
                >
                  {issue.message}
                </button>
              ) : (
                issue.message
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
