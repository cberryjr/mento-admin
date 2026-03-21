import Link from "next/link";
import { notFound } from "next/navigation";

import { getQuoteById } from "@/features/quotes/server/queries/get-quote-by-id";
import { getClientById } from "@/features/clients/server/queries/get-client-by-id";
import { GenerateQuoteButton } from "@/features/quotes/components/generate-quote-button";
import { QuoteStructureView } from "@/features/quotes/components/quote-structure-view";
import { QuoteStructureEditor } from "@/features/quotes/components/quote-structure-editor";
import { getServicePackageById } from "@/features/service-packages/server/queries/get-service-package-by-id";

type QuoteDetailPageProps = {
  params: Promise<{ quoteId: string }>;
  searchParams: Promise<{ backTo?: string; saved?: string }>;
};

const DEFAULT_BACK_TO = "/quotes";

function sanitizeBackTo(backTo?: string) {
  if (!backTo || !backTo.startsWith("/") || backTo.startsWith("//")) {
    return DEFAULT_BACK_TO;
  }

  try {
    const parsedBackTo = new URL(backTo, "https://mento-admin.local");

    if (parsedBackTo.pathname !== DEFAULT_BACK_TO) {
      return DEFAULT_BACK_TO;
    }

    const search = parsedBackTo.searchParams.get("search");
    if (!search) {
      return DEFAULT_BACK_TO;
    }

    return `${DEFAULT_BACK_TO}?search=${encodeURIComponent(search)}`;
  } catch {
    return DEFAULT_BACK_TO;
  }
}

export default async function QuoteDetailPage({
  params,
  searchParams,
}: QuoteDetailPageProps) {
  const { quoteId } = await params;
  const { backTo, saved } = await searchParams;
  const result = await getQuoteById(quoteId);

  if (!result.ok) {
    notFound();
  }

  const { quote } = result.data;
  const safeBackTo = sanitizeBackTo(backTo);

  const clientResult = await getClientById(quote.clientId);
  const clientName = clientResult.ok
    ? clientResult.data.client.name
    : "Unknown client";

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
        <Link
          href={safeBackTo}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Back to quotes
        </Link>
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

        <div className="space-y-1">
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
              <li key={spId}>{spId}</li>
            ))}
          </ul>
        )}
      </div>

      {quote.status === "draft" && !hasGeneratedContent ? (
        <GenerateQuoteButton quoteId={quote.id} />
      ) : null}

      {hasGeneratedContent && quote.status === "draft" ? (
        <QuoteStructureEditor
          quoteId={quote.id}
          initialSections={quote.sections}
          sourcePackageNames={sourcePackageNames}
        />
      ) : hasGeneratedContent ? (
        <QuoteStructureView sections={quote.sections} />
      ) : null}
    </section>
  );
}
