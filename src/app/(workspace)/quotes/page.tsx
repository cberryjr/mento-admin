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

  if (result.data.quotes.length === 0) {
    return (
      <EmptyState
        title="No quotes yet"
        description="Start a quote draft once clients and service packages are ready."
        action={
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Start quote draft
          </button>
        }
      />
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900">Quotes</h2>
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {result.data.quotes.map((quote) => (
          <li key={quote.id} className="px-4 py-3 text-sm text-zinc-700">
            {quote.title} · {quote.status}
          </li>
        ))}
      </ul>
    </section>
  );
}
