import Link from "next/link";
import { notFound } from "next/navigation";

import { getQuoteById } from "@/features/quotes/server/queries/get-quote-by-id";
import { getClientById } from "@/features/clients/server/queries/get-client-by-id";
import { GenerateQuoteButton } from "@/features/quotes/components/generate-quote-button";
import { QuoteStructureView } from "@/features/quotes/components/quote-structure-view";
import { QuoteStructureEditor } from "@/features/quotes/components/quote-structure-editor";
import { EstimateBreakdownPanel } from "@/features/quotes/components/estimate-breakdown-panel";
import {
  buildQuotePreviewHref,
  sanitizeQuoteBackTo,
} from "@/features/quotes/lib/navigation";
import { getServicePackageById } from "@/features/service-packages/server/queries/get-service-package-by-id";

type QuoteDetailPageProps = {
  params: Promise<{ quoteId: string }>;
  searchParams: Promise<{ backTo?: string; preview?: string; saved?: string }>;
};

function renderQuoteLoadFailure(message: string, backTo?: string) {
  return (
    <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Quote details</h2>
        </div>
        <Link
          href={sanitizeQuoteBackTo(backTo)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Back to quotes
        </Link>
      </div>
      <section
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
      >
        <p className="font-semibold">Could not load quote</p>
        <p className="mt-1">{message}</p>
        <p className="mt-1">
          Try reloading the page, or return to the quotes list and reopen the quote.
        </p>
      </section>
    </section>
  );
}

export default async function QuoteDetailPage({
  params,
  searchParams,
}: QuoteDetailPageProps) {
  const { quoteId } = await params;
  const { backTo, preview, saved } = await searchParams;
  const result = await getQuoteById(quoteId);

  if (!result.ok) {
    if (result.error.message === "Quote not found.") {
      notFound();
    }

    return renderQuoteLoadFailure(result.error.message, backTo);
  }

  const { quote } = result.data;
  const safeBackTo = sanitizeQuoteBackTo(backTo);
  const isRevisionReady = saved === "revised" && quote.status === "draft";

  const clientResult = await getClientById(quote.clientId);

  if (!clientResult.ok) {
    return renderQuoteLoadFailure(clientResult.error.message, backTo);
  }

  const clientName = clientResult.data.client.name;

  const hasGeneratedContent = quote.sections.length > 0;
  const servicePackageEntries = await Promise.all(
    quote.selectedServicePackageIds.map(async (servicePackageId) => {
      const servicePackageResult = await getServicePackageById(servicePackageId);

      if (!servicePackageResult.ok) {
        return null;
      }

      return [servicePackageId, servicePackageResult.data.servicePackage.name] as const;
    }),
  );
  const sourcePackageNames = Object.fromEntries(
    servicePackageEntries.filter(
      (entry): entry is readonly [string, string] => entry !== null,
    ),
  );

  const breakdown = hasGeneratedContent ? quote.estimateBreakdown ?? null : null;

  return (
    <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">
            Quote details
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Review the quote draft details, client association, and selected
            service packages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasGeneratedContent && quote.status === "draft" ? (
            <Link
              href={buildQuotePreviewHref(
                quote.id,
                safeBackTo,
                isRevisionReady ? "revised" : undefined,
              )}
              className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
            >
              Preview quote
            </Link>
          ) : null}
          <Link
            href={safeBackTo}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Back to quotes
          </Link>
        </div>
      </div>

      {saved === "created" ? (
        <section
          role="status"
          className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900"
        >
          <p className="font-semibold">Quote draft created</p>
          <p className="mt-1">
            Your quote draft is saved. Generate quote content from the selected
            service packages to continue.
          </p>
        </section>
      ) : null}

      {preview === "unavailable" ? (
        <section
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p className="font-semibold">Quote preview unavailable</p>
          <p className="mt-1">
            Generate quote content from the selected service packages before opening the preview.
          </p>
        </section>
      ) : null}

      {preview === "blocked" ? (
        <section
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p className="font-semibold">Quote preview blocked</p>
          <p className="mt-1">
            Resolve the preview readiness issues before opening the client-facing preview.
          </p>
        </section>
      ) : null}

      {isRevisionReady ? (
        <section
          role="status"
          className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900"
        >
          <p className="font-semibold">Revising existing quote</p>
          <p className="mt-1">
            You are continuing from an existing quote. Make your changes and save to update the quote.
          </p>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Quote number
          </p>
          <p className="text-sm font-semibold text-zinc-900">
            {quote.quoteNumber}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Status
          </p>
          <p className="text-sm font-semibold text-zinc-900">{quote.status}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Title
          </p>
          <p className="text-sm text-zinc-900">{quote.title}</p>
        </div>

        <div id="quote-client-summary" tabIndex={-1} className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Client
          </p>
          <p className="text-sm text-zinc-900">{clientName}</p>
        </div>
      </div>

      {quote.terms ? (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Terms
          </p>
          <p className="text-sm text-zinc-900">{quote.terms}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Selected service packages ({quote.selectedServicePackageIds.length})
        </p>
        {quote.selectedServicePackageIds.length === 0 ? (
          <p className="text-sm text-zinc-500">No packages selected.</p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700">
            {quote.selectedServicePackageIds.map((spId) => (
              <li key={spId}>
                {sourcePackageNames[spId]
                  ? sourcePackageNames[spId]
                  : "Selected package currently unavailable"}
              </li>
            ))}
          </ul>
        )}
      </div>

      {quote.status === "draft" && !hasGeneratedContent ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600">
            Generate quote content to unlock the editor and preview controls.
          </p>
          <GenerateQuoteButton quoteId={quote.id} />
        </div>
      ) : null}

      {hasGeneratedContent && quote.status === "draft" ? (
        <QuoteStructureEditor
          quoteId={quote.id}
          initialSections={quote.sections}
          initialEstimateBreakdown={quote.estimateBreakdown ?? null}
          sourcePackageNames={sourcePackageNames}
          clientId={quote.clientId}
          backTo={safeBackTo}
          saved={isRevisionReady ? "revised" : undefined}
        />
      ) : hasGeneratedContent ? (
        <QuoteStructureView sections={quote.sections} />
      ) : null}

      {breakdown ? (
        <EstimateBreakdownPanel breakdown={breakdown} />
      ) : null}
    </section>
  );
}
