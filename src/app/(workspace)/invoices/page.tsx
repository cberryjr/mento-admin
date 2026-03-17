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
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            View quote pipeline
          </button>
        }
      />
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900">Invoices</h2>
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {result.data.invoices.map((invoice) => (
          <li key={invoice.id} className="px-4 py-3 text-sm text-zinc-700">
            {invoice.invoiceNumber} · {invoice.status}
          </li>
        ))}
      </ul>
    </section>
  );
}
