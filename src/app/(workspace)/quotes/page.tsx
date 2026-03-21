import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { buildQuoteRevisionReadyHref } from "@/features/quotes/lib/navigation";
import { listQuotes } from "@/features/quotes/server/queries/list-quotes";
import type { QuoteStatus } from "@/features/quotes/types";
import { formatDate } from "@/lib/format/dates";

function StatusBadge({ status }: { status: QuoteStatus }) {
  const styles: Record<QuoteStatus, string> = {
    draft: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    invoiced: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default async function QuotesPage() {
  const result = await listQuotes();

  if (!result.ok) {
    return (
      <InlineAlert
        title="Could not load quotes"
        message="Refresh the page and try again."
      />
    );
  }

  const createAction = (
    <Link
      href="/quotes/new"
      className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
    >
      Start quote draft
    </Link>
  );

  if (result.data.quotes.length === 0) {
    return (
      <EmptyState
        title="No quotes yet"
        description="Start a quote draft once clients and service packages are ready."
        action={createAction}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Quotes</h2>
          <p className="text-sm text-zinc-600">
            Browse, create, and manage your quote drafts.
          </p>
        </div>
        {createAction}
      </div>

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {result.data.quotes.map((quote) => (
          <li key={quote.id} className="flex items-center justify-between gap-3 px-4 py-4">
            <Link
              href={`/quotes/${quote.id}`}
              aria-label={`Open ${quote.title}`}
              className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-900">
                  {quote.title}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                  <span>{quote.quoteNumber}</span>
                  <StatusBadge status={quote.status} />
                </span>
              </span>
              <span className="flex flex-col items-end gap-1 text-xs text-zinc-500">
                <span>{formatDate(quote.updatedAt)}</span>
                <span className="text-zinc-400">Open</span>
              </span>
            </Link>

            {quote.status === "draft" ? (
              <Link
                href={buildQuoteRevisionReadyHref(quote.id)}
                aria-label={`Revise ${quote.title}`}
                className="shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                Revise
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
