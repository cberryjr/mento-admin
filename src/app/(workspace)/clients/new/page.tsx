import Link from "next/link";

import { ClientForm } from "@/features/clients/components/client-form";
import { createClient } from "@/features/clients/server/actions/create-client";

export default function NewClientPage() {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Create client</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Save a lightweight client record that future quotes and invoices can reuse.
          </p>
        </div>
        <Link
          href="/clients"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Back to clients
        </Link>
      </div>

      <ClientForm mode="create" initialValues={null} submitAction={createClient} />
    </section>
  );
}
