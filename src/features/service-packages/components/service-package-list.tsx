"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Input } from "@/components/ui/input";
import type { ServicePackageSummary } from "@/features/service-packages/types";
import { formatDate } from "@/lib/format/dates";

type ServicePackageListProps = {
  servicePackages: ServicePackageSummary[];
  action?: ReactNode;
  initialQuery?: string;
};

const ACTION_CLASS_NAME =
  "inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

function formatRecordCount(count: number) {
  return `${count} service package${count === 1 ? "" : "s"}`;
}

function hasActiveQuery(query: string) {
  return query.trim() !== "";
}

function formatVisibleRecordSummary(visibleCount: number, totalCount: number, query: string) {
  return hasActiveQuery(query) ? `${formatRecordCount(visibleCount)} shown` : formatRecordCount(totalCount);
}

function buildBackToPath(query: string) {
  const normalizedQuery = query.trim();

  if (normalizedQuery === "") {
    return "/service-packages";
  }

  return `/service-packages?search=${encodeURIComponent(normalizedQuery)}`;
}

function matchesSearch(servicePackage: ServicePackageSummary, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery === "") {
    return true;
  }

  return [
    servicePackage.name,
    servicePackage.category,
    servicePackage.startingPriceLabel,
    servicePackage.shortDescription,
  ].some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function ServicePackageList({
  servicePackages,
  action,
  initialQuery = "",
}: ServicePackageListProps) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const filteredServicePackages = useMemo(
    () => servicePackages.filter((servicePackage) => matchesSearch(servicePackage, query)),
    [query, servicePackages],
  );

  const activeQuery = hasActiveQuery(query);
  const visibleRecordSummary = formatVisibleRecordSummary(
    filteredServicePackages.length,
    servicePackages.length,
    query,
  );
  const backToPath = buildBackToPath(query);

  const createAction = action ?? (
    <Link href="/service-packages/new" className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
      Create service package
    </Link>
  );

  if (servicePackages.length === 0) {
    return (
      <EmptyState
        title="No service packages yet"
        description="Create a reusable package to speed up quote generation."
        action={createAction}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            {activeQuery ? "Visible results" : "Library size"}
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900">
            {visibleRecordSummary}
          </p>
          {activeQuery ? (
            <p className="mt-1 text-xs text-zinc-500">Filtered from {formatRecordCount(servicePackages.length)}.</p>
          ) : null}
        </div>

        <div className="w-full sm:max-w-sm">
          <label
            htmlFor="service-package-search"
            className="mb-1 block text-sm font-medium text-zinc-900"
          >
            Search service packages
          </label>
          <Input
            id="service-package-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, category, price, or summary"
          />
        </div>
      </div>

      {filteredServicePackages.length === 0 ? (
        <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center">
          <h3 className="text-lg font-semibold text-zinc-900">No service packages match your search</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Clear the current filter to browse the full package library again.
          </p>
          <div className="mt-4">
            <button type="button" onClick={() => setQuery("")} className={ACTION_CLASS_NAME}>
              Clear search
            </button>
          </div>
        </section>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
          {filteredServicePackages.map((servicePackage) => (
            <li key={servicePackage.id}>
              <Link
                href={`/service-packages/${servicePackage.id}?backTo=${encodeURIComponent(backToPath)}`}
                className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">
                    {servicePackage.name}
                  </span>
                  <span className="block text-sm text-zinc-600">
                    {servicePackage.category} · Starts at {servicePackage.startingPriceLabel}
                  </span>
                  {servicePackage.shortDescription ? (
                    <span className="block text-sm text-zinc-500">
                      {servicePackage.shortDescription}
                    </span>
                  ) : null}
                  <span className="mt-1 block text-xs text-zinc-500">
                    Updated {formatDate(servicePackage.updatedAt)}
                  </span>
                </span>
                <span className="text-xs text-zinc-500">Open</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
