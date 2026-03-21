"use client";

import { useState } from "react";

import type { EstimateBreakdownPayload } from "@/features/quotes/types";
import { formatCurrencyFromCents } from "@/lib/format/currency";

type EstimateBreakdownPanelProps = {
  breakdown: EstimateBreakdownPayload;
  isPreview?: boolean;
};

function formatHours(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function formatSourceDefaults(
  source: EstimateBreakdownPayload["sectionBreakdowns"][number]["source"],
): string {
  return [
    `Qty ${source.variableDefaults.quantity}`,
    source.variableDefaults.resolution
      ? `Resolution ${source.variableDefaults.resolution.toUpperCase()}`
      : null,
    `Revisions ${source.variableDefaults.revisions}`,
    `Urgency ${source.variableDefaults.urgency}`,
  ]
    .filter(Boolean)
    .join(" • ");
}

function SectionBreakdown({
  section,
}: {
  section: EstimateBreakdownPayload["sectionBreakdowns"][number];
}) {
  const { sectionTitle, source, breakdown } = section;

  return (
    <section aria-label={`Estimate breakdown for ${sectionTitle}`} className="space-y-3">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-zinc-900">{sectionTitle}</h4>
        <p className="text-xs text-zinc-500">
          Source: {source.servicePackageName} · {source.tierTitle} tier ·
          {" "}
          {source.timeGuidance.minValue}-{source.timeGuidance.maxValue}
          {" "}
          {source.timeGuidance.unit}
        </p>
        <p className="text-xs text-zinc-500">Inputs: {formatSourceDefaults(source)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Estimated hours
          </p>
          <p className="text-sm font-semibold text-zinc-900">
            {formatHours(breakdown.estimatedHours.min)} – {formatHours(breakdown.estimatedHours.max)} hrs
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Internal cost
          </p>
          <p className="text-sm font-semibold text-zinc-900">
            {formatCurrencyFromCents(breakdown.internalCostCents)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Final price
          </p>
          <p className="text-sm font-semibold text-zinc-900">
            {formatCurrencyFromCents(breakdown.finalPriceCents)}
          </p>
        </div>
      </div>

      {breakdown.roleBreakdown.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <caption className="sr-only">Role breakdown for {sectionTitle}</caption>
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="pb-2 pr-4" scope="col">Role</th>
                <th className="pb-2 pr-4 text-right" scope="col">Hours</th>
                <th className="pb-2 pr-4 text-right" scope="col">Rate</th>
                <th className="pb-2 text-right" scope="col">Cost</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.roleBreakdown.map((entry) => (
                <tr key={entry.role} className="border-b border-zinc-100">
                  <td className="py-2 pr-4 font-medium text-zinc-900">
                    {entry.role}
                  </td>
                  <td className="py-2 pr-4 text-right text-zinc-600">
                    {formatHours(entry.hours)}
                  </td>
                  <td className="py-2 pr-4 text-right text-zinc-600">
                    {formatCurrencyFromCents(entry.hourlyRateCents)}/hr
                  </td>
                  <td className="py-2 text-right font-medium text-zinc-900">
                    {formatCurrencyFromCents(entry.costCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-500">
          Margin ({Math.round(breakdown.marginPercent * 100)}%)
        </span>
        <span className="font-medium text-zinc-900">
          {formatCurrencyFromCents(breakdown.marginCents)}
        </span>
      </div>

      {breakdown.deliverables.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Deliverables
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-zinc-700">
            {breakdown.deliverables.map((d, i) => (
              <li key={`${d}-${i}`}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function EstimateBreakdownPanel({
  breakdown,
  isPreview = false,
}: EstimateBreakdownPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!isPreview);
  const hasSections = breakdown.sectionBreakdowns.length > 0;

  if (!hasSections) {
    return (
      <div
        role="status"
        className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500"
      >
        No estimate breakdown available. Quote sections must reference service packages with complexity tier data.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">
            Estimate breakdown
          </h3>
          <p className="text-xs text-zinc-500">
            Derived from service package complexity tiers
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          aria-expanded={isExpanded}
          aria-controls="estimate-breakdown-details"
        >
          {isExpanded ? "Collapse" : "Expand details"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Est. hours
          </p>
          <p className="text-sm font-semibold text-zinc-900">
            {formatHours(breakdown.grandTotal.estimatedHours.min)} – {formatHours(breakdown.grandTotal.estimatedHours.max)} hrs
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Internal cost
          </p>
          <p className="text-sm font-semibold text-zinc-900">
            {formatCurrencyFromCents(breakdown.grandTotal.internalCostCents)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Margin
          </p>
          <p className="text-sm font-semibold text-zinc-900">
            {formatCurrencyFromCents(breakdown.grandTotal.marginCents)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Final price
          </p>
          <p className="text-lg font-bold text-zinc-900">
            {formatCurrencyFromCents(breakdown.grandTotal.finalPriceCents)}
          </p>
        </div>
      </div>

      {isExpanded ? (
        <div
          id="estimate-breakdown-details"
          className="space-y-6 border-t border-zinc-200 pt-4"
        >
          {breakdown.sectionBreakdowns.map((sb) => (
            <SectionBreakdown
              key={sb.sectionId}
              section={sb}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
