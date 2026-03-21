import Link from "next/link";

import { QuoteSetupForm } from "@/features/quotes/components/quote-setup-form";
import { createQuote } from "@/features/quotes/server/actions/create-quote";
import { listClients } from "@/features/clients/server/queries/list-clients";
import { listServicePackages } from "@/features/service-packages/server/queries/list-service-packages";
import { InlineAlert } from "@/components/feedback/inline-alert";

export default async function NewQuotePage() {
  const [clientsResult, packagesResult] = await Promise.all([
    listClients(),
    listServicePackages(),
  ]);

  if (!clientsResult.ok) {
    return (
      <InlineAlert
        title="Could not load clients"
        message="Refresh the page and try again."
      />
    );
  }

  if (!packagesResult.ok) {
    return (
      <InlineAlert
        title="Could not load service packages"
        message="Refresh the page and try again."
      />
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">
            Start a new quote
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Select a client and choose reusable service packages to begin a
            quote draft.
          </p>
        </div>
        <Link
          href="/quotes"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Back to quotes
        </Link>
      </div>

      <QuoteSetupForm
        clients={clientsResult.data.clients}
        servicePackages={packagesResult.data.servicePackages}
        submitAction={createQuote}
      />
    </section>
  );
}
