import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import type {
  ClientRecord,
  RelatedInvoiceSummary,
  RelatedQuoteSummary,
} from "@/features/clients/types";
import { formatDate } from "@/lib/format/dates";

type ClientRecordSummaryProps = {
  client: ClientRecord;
  relatedQuotes: RelatedQuoteSummary[];
  relatedInvoices: RelatedInvoiceSummary[];
};

const ACTION_LINK_CLASS_NAME =
  "inline-flex rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

const RECORD_STATUS_LABELS: Record<string, string | undefined> = {
  draft: "Draft",
  accepted: "Accepted",
  sent: "Sent",
  paid: "Paid",
};

function formatStatus(value: string): string {
  return RECORD_STATUS_LABELS[value] ?? value;
}

function RecordListItem({
  eyebrow,
  title,
  status,
  updatedAt,
}: {
  eyebrow: string;
  title: string;
  status: string;
  updatedAt: string;
}) {
  return (
    <li className="space-y-2 px-4 py-4 text-sm text-zinc-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
          {eyebrow}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
          {formatStatus(status)}
        </span>
      </div>
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="text-xs text-zinc-500">Updated {formatDate(updatedAt)}</p>
    </li>
  );
}

function RelatedRecordsSection({
  id,
  title,
  description,
  actionHref,
  actionLabel,
  emptyTitle,
  emptyDescription,
  items,
}: {
  id: string;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  items: Array<{
    id: string;
    eyebrow: string;
    title: string;
    status: string;
    updatedAt: string;
  }>;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5"
    >
      <div>
        <h3 id={`${id}-heading`} className="text-lg font-semibold text-zinc-900">
          {title}
        </h3>
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Link href={actionHref} className={ACTION_LINK_CLASS_NAME}>
              {actionLabel}
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-zinc-50/50">
          {items.map((item) => (
            <RecordListItem key={item.id} {...item} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function ClientRecordSummary({
  client,
  relatedQuotes,
  relatedInvoices,
}: ClientRecordSummaryProps) {
  return (
    <div className="space-y-4">
      <section
        aria-labelledby="client-record-heading"
        className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="client-record-heading" className="text-lg font-semibold text-zinc-900">
              Client record
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              Saved contact details and recent commercial activity for {client.name}.
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Updated {formatDate(client.updatedAt)}
          </p>
        </div>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              Client name
            </dt>
            <dd className="mt-1 text-sm font-semibold text-zinc-900">{client.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              Contact name
            </dt>
            <dd className="mt-1 text-sm text-zinc-700">{client.contactName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              Contact email
            </dt>
            <dd className="mt-1 text-sm text-zinc-700">{client.contactEmail}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              Contact phone
            </dt>
            <dd className="mt-1 text-sm text-zinc-700">{client.contactPhone}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <RelatedRecordsSection
          id="related-quotes"
          title="Related quotes"
          description={`Summary-level quote context currently associated with ${client.name}.`}
          actionHref="/quotes"
          actionLabel="Open quotes workspace"
          emptyTitle="No quotes for this client yet"
          emptyDescription="Quotes linked to this client will appear here once a draft is started or reopened from the quotes workspace."
          items={relatedQuotes.map((quote) => ({
            id: quote.id,
            eyebrow: quote.quoteNumber,
            title: quote.title,
            status: quote.status,
            updatedAt: quote.updatedAt,
          }))}
        />
        <RelatedRecordsSection
          id="related-invoices"
          title="Related invoices"
          description={`Summary-level invoice context currently associated with ${client.name}.`}
          actionHref="/invoices"
          actionLabel="Open invoices workspace"
          emptyTitle="No invoices for this client yet"
          emptyDescription="Invoices linked to this client will appear here after accepted work moves into the invoicing flow."
          items={relatedInvoices.map((invoice) => ({
            id: invoice.id,
            eyebrow: invoice.invoiceNumber,
            title: invoice.title,
            status: invoice.status,
            updatedAt: invoice.updatedAt,
          }))}
        />
      </div>
    </div>
  );
}
