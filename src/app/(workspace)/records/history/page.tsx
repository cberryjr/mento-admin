import Link from "next/link";

import { getRecordHistory } from "@/features/record-history/server/queries/get-record-history";
import { ConnectedRecordHistory } from "@/features/record-history/components/connected-record-history";
import { InlineAlert } from "@/components/feedback/inline-alert";
import type { EntityType } from "@/features/record-history/types";
import { buildRecordHistoryHref } from "@/lib/navigation/record-history";

type RecordHistoryPageProps = {
  searchParams: Promise<{ type?: string; id?: string; backTo?: string }>;
};

const VALID_TYPES: EntityType[] = ["client", "quote", "invoice"];

function sanitizeBackTo(backTo?: string): string {
  if (!backTo || !backTo.startsWith("/") || backTo.startsWith("//")) {
    return "/quotes";
  }

  return backTo;
}

export default async function RecordHistoryPage({
  searchParams,
}: RecordHistoryPageProps) {
  const { type, id, backTo } = await searchParams;
  const safeBackTo = sanitizeBackTo(backTo);

  if (!type || !id || !VALID_TYPES.includes(type as EntityType)) {
    return (
      <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Record history</h2>
          </div>
          <Link
            href={safeBackTo}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Back
          </Link>
        </div>
        <InlineAlert
          title="Invalid parameters"
          message="A valid record type (client, quote, or invoice) and record ID are required to view connected history."
        />
        <p className="mt-1 text-sm text-zinc-600">
          Navigate to a client, quote, or invoice detail page and use the &quot;View Record History&quot; action to trace connected records.
        </p>
      </section>
    );
  }

  const result = await getRecordHistory({
    entityType: type as EntityType,
    entityId: id,
    historyHref: buildRecordHistoryHref({
      entityType: type as EntityType,
      entityId: id,
      backTo: safeBackTo,
    }),
  });

  if (!result.ok) {
    return (
      <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Record history</h2>
          </div>
          <Link
            href={safeBackTo}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Back
          </Link>
        </div>
        <InlineAlert
          title="Could not load record history"
          message={result.error.message}
        />
        <p className="mt-1 text-sm text-zinc-600">
          Try reloading the page, or return to the originating record and try again.
        </p>
      </section>
    );
  }

  return <ConnectedRecordHistory recordChain={result.data} backTo={safeBackTo} />;
}
