import Link from "next/link";
import { notFound } from "next/navigation";
import { getServicePackageById } from "@/features/service-packages/server/queries/get-service-package-by-id";

type ServicePackageDetailPageProps = {
  params: Promise<{ servicePackageId: string }>;
  searchParams: Promise<{ backTo?: string }>;
};

export default async function ServicePackageDetailPage({
  params,
  searchParams,
}: ServicePackageDetailPageProps) {
  const { servicePackageId } = await params;
  const { backTo } = await searchParams;
  const result = await getServicePackageById(servicePackageId);

  if (!result.ok) {
    notFound();
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-zinc-900">
          {result.data.servicePackage.name}
        </h2>
        <Link
          href={backTo ?? "/service-packages"}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Back to service packages
        </Link>
      </div>

      <dl className="grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-zinc-500">Category</dt>
          <dd>{result.data.servicePackage.category}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Starting Price</dt>
          <dd>{result.data.servicePackage.startingPriceLabel}</dd>
        </div>
      </dl>
    </section>
  );
}
