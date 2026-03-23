import Link from "next/link";
import { notFound } from "next/navigation";

import { getQuoteById } from "@/features/quotes/server/queries/get-quote-by-id";
import { listQuoteRevisions } from "@/features/quotes/server/quotes-repository";
import { RevisionTimeline } from "@/features/quotes/components/revision-timeline";
import { InlineAlert } from "@/components/feedback/inline-alert";
import {
  buildQuoteDetailHref,
  sanitizeQuoteBackTo,
} from "@/features/quotes/lib/navigation";

type RevisionsPageProps = {
  params: Promise<{ quoteId: string }>;
  searchParams: Promise<{ backTo?: string; selectedRevision?: string }>;
};

export default async function RevisionsPage({
  params,
  searchParams,
}: RevisionsPageProps) {
  const { quoteId } = await params;
  const { backTo, selectedRevision } = await searchParams;
  const safeBackTo = sanitizeQuoteBackTo(backTo);

  const result = await getQuoteById(quoteId);

  if (!result.ok) {
    if (result.error.message === "Quote not found.") {
      notFound();
    }

    return (
      <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Revision history</h2>
          </div>
          <Link
            href={safeBackTo}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Back to quotes
          </Link>
        </div>
        <InlineAlert title="Could not load revision history" message={result.error.message} />
      </section>
    );
  }

  const { quote } = result.data;

  const revisions = await listQuoteRevisions(quote.id, quote.studioId);
  const quoteDetailHref = buildQuoteDetailHref(quote.id, safeBackTo);

  const currentVersion = {
    title: quote.title,
    terms: quote.terms,
    updatedAt: quote.updatedAt,
    sections: quote.sections,
  };

  return (
    <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
          <li>
            <Link className="hover:text-zinc-900" href={safeBackTo}>
              Quotes
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link className="hover:text-zinc-900" href={quoteDetailHref}>
              {quote.quoteNumber}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span aria-current="page" className="font-medium text-zinc-900">
              Revision history
            </span>
          </li>
        </ol>
      </nav>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Revision history</h2>
          <p className="mt-2 text-sm text-zinc-600">
            {quote.title} — {quote.quoteNumber}
          </p>
        </div>
        <Link
          href={quoteDetailHref}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Back to quote
        </Link>
      </div>

      <RevisionTimeline
        revisions={revisions}
        currentVersion={currentVersion}
        initialSelectedRevisionId={selectedRevision}
      />
    </section>
  );
}
