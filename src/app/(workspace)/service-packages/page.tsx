import Link from "next/link";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { ServicePackageList } from "@/features/service-packages/components/service-package-list";
import { listServicePackages } from "@/features/service-packages/server/queries/list-service-packages";

type ServicePackagesPageProps = {
  searchParams?: Promise<{ search?: string }>;
};

export default async function ServicePackagesPage({ searchParams }: ServicePackagesPageProps = {}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const result = await listServicePackages();

  if (!result.ok) {
    return (
      <InlineAlert
        title="Could not load service packages"
        message="Refresh the page and try again."
      />
    );
  }

  const createAction = (
    <Link
      href="/service-packages/new"
      className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
    >
      Create service package
    </Link>
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Service Packages</h2>
          <p className="text-sm text-zinc-600">Open a package to review structure and pricing.</p>
        </div>
        {result.data.servicePackages.length > 0 ? createAction : null}
      </div>

      <ServicePackageList
        servicePackages={result.data.servicePackages}
        action={createAction}
        initialQuery={resolvedSearchParams?.search}
      />
    </section>
  );
}
