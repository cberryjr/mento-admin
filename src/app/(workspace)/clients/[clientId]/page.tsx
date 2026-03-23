import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "@/features/clients/components/client-form";
import { ClientRecordSummary } from "@/features/clients/components/client-record-summary";
import { updateClient } from "@/features/clients/server/actions/update-client";
import { getClientById } from "@/features/clients/server/queries/get-client-by-id";
import { buildRecordHistoryHref } from "@/lib/navigation/record-history";

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

  // Sanitize backTo to prevent open-redirect: only allow relative paths.
  const safeBackTo =
    backTo && backTo.startsWith("/") && !backTo.startsWith("//")
      ? backTo
      : "/clients";

  return (
    <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Client details</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Review the saved client record alongside recent quote and invoice context,
            then make changes when details need to be refreshed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={buildRecordHistoryHref({
              entityType: "client",
              entityId: clientId,
              backTo: safeBackTo,
            })}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            View Record History
          </Link>
          <Link
            href={safeBackTo}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Back to clients
          </Link>
        </div>
      </div>

      <ClientRecordSummary
        client={result.data.client}
        relatedQuotes={result.data.relatedQuotes}
        relatedInvoices={result.data.relatedInvoices}
      />

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
