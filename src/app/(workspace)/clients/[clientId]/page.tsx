import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "@/features/clients/components/client-form";
import { updateClient } from "@/features/clients/server/actions/update-client";
import { getClientById } from "@/features/clients/server/queries/get-client-by-id";

type ClientDetailPageProps = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ backTo?: string; saved?: string }>;
};

export default async function ClientDetailPage({
  params,
  searchParams,
}: ClientDetailPageProps) {
  const { clientId } = await params;
  const { backTo, saved } = await searchParams;
  const result = await getClientById(clientId);

  if (!result.ok) {
    notFound();
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Edit client</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Keep client details current so future quotes and invoices use the latest saved
            information.
          </p>
        </div>
        <Link
          href={backTo ?? "/clients"}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Back to clients
        </Link>
      </div>

      <ClientForm
        mode="edit"
        initialValues={result.data.client}
        submitAction={updateClient.bind(null, clientId)}
        initialNotice={
          saved === "created"
            ? {
                tone: "success",
                title: "Client created",
                message:
                  "Client saved. This record is ready for future quotes and invoices.",
              }
            : null
        }
      />
    </section>
  );
}
