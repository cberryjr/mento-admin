import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { listClients } from "@/features/clients/server/queries/list-clients";

export default async function ClientsPage() {
  const result = await listClients();

  if (!result.ok) {
    return (
      <InlineAlert
        title="Could not load clients"
        message="Refresh the page and try again."
      />
    );
  }

  if (result.data.clients.length === 0) {
    return (
      <EmptyState
        title="No clients yet"
        description="Create your first client to start building quotes and invoices."
        action={
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Create client
          </button>
        }
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Clients</h2>
          <p className="text-sm text-zinc-600">Open a client to continue where you left off.</p>
        </div>
        <button
          type="button"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Create client
        </button>
      </div>

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {result.data.clients.map((client) => (
          <li key={client.id}>
            <Link
              href={`/clients/${client.id}?backTo=/clients`}
              className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              <span>
                <span className="block text-sm font-semibold text-zinc-900">{client.name}</span>
                <span className="block text-sm text-zinc-600">{client.contactEmail}</span>
              </span>
              <span className="text-xs text-zinc-500">Open</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
