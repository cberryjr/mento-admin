import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { listQuotes } from "@/features/quotes/server/queries/list-quotes";

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
          <li key={quote.id}>
            <Link
              href={`/quotes/${quote.id}`}
              className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              <span>
                <span className="block text-sm font-semibold text-zinc-900">
                  {quote.title}
                </span>
                <span className="block text-xs text-zinc-500">
                  {quote.quoteNumber} · {quote.status}
                </span>
              </span>
              <span className="text-xs text-zinc-500">Open</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
