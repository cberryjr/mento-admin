import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/features/clients/server/queries/get-client-by-id";

type ClientDetailPageProps = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ backTo?: string }>;
};

export default async function ClientDetailPage({
  params,
  searchParams,
}: ClientDetailPageProps) {
  const { clientId } = await params;
  const { backTo } = await searchParams;
  const result = await getClientById(clientId);

  if (!result.ok) {
    notFound();
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-zinc-900">{result.data.client.name}</h2>
        <Link
          href={backTo ?? "/clients"}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Back to clients
        </Link>
      </div>

      <dl className="grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-zinc-500">Contact Email</dt>
          <dd>{result.data.client.contactEmail}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Last Quote Update</dt>
          <dd>{new Date(result.data.client.lastQuoteUpdatedAt).toLocaleString()}</dd>
        </div>
      </dl>
    </section>
  );
}
