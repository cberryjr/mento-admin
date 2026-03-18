import Link from "next/link";
import { notFound } from "next/navigation";
import { ServicePackageForm } from "@/features/service-packages/components/service-package-form";
import { updateServicePackage } from "@/features/service-packages/server/actions/update-service-package";
import { getServicePackageById } from "@/features/service-packages/server/queries/get-service-package-by-id";

type ServicePackageDetailPageProps = {
  params: Promise<{ servicePackageId: string }>;
  searchParams: Promise<{ backTo?: string; saved?: string }>;
};

export default async function ServicePackageDetailPage({
  params,
  searchParams,
}: ServicePackageDetailPageProps) {
  const { servicePackageId } = await params;
  const { backTo, saved } = await searchParams;
  const result = await getServicePackageById(servicePackageId);

  if (!result.ok) {
    notFound();
  }

  return (
    <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Service package details</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Update this reusable package definition so future quote workflows use the latest
            saved package details.
          </p>
        </div>
        <Link
          href={backTo ?? "/service-packages"}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Back to service packages
        </Link>
      </div>

      <ServicePackageForm
        mode="edit"
        initialValues={result.data.servicePackage}
        submitAction={updateServicePackage.bind(null, servicePackageId)}
        initialNotice={
          saved === "created"
            ? {
                tone: "success",
                title: "Service package created",
                message:
                  "Service package saved. This reusable source record is ready for future quote workflows.",
              }
            : null
        }
      />
    </section>
  );
}
