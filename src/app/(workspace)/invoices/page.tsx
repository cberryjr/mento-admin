import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { listInvoices } from "@/features/invoices/server/queries/list-invoices";

export default async function InvoicesPage() {
  const result = await listInvoices();

  if (!result.ok) {
    return (
      <InlineAlert
        title="Could not load invoices"
        message="Refresh the page and try again."
      />
    );
  }

  if (result.data.invoices.length === 0) {
    return (
      <EmptyState
        title="No invoices yet"
        description="Invoices appear here after accepted quotes are converted."
        action={
          <Link
            href="/quotes"
            className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            View quote pipeline
          </Link>
        }
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Invoices</h2>
          <p className="text-sm text-zinc-600">Browse and manage your invoices.</p>
        </div>
      </div>

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {result.data.invoices.map((invoice) => (
          <li key={invoice.id}>
            <Link
              href={`/invoices/${invoice.id}?backTo=/invoices`}
              className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              <span>
                <span className="block text-sm font-semibold text-zinc-900">
                  {invoice.invoiceNumber}
                </span>
                <span className="block text-sm text-zinc-600">{invoice.title}</span>
              </span>
              <span className="text-xs text-zinc-500">{invoice.status}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
