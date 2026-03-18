import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { listServicePackages } from "@/features/service-packages/server/queries/list-service-packages";

export default async function ServicePackagesPage() {
  const result = await listServicePackages();

  if (!result.ok) {
    return (
      <InlineAlert
        title="Could not load service packages"
        message="Refresh the page and try again."
      />
    );
  }

  if (result.data.servicePackages.length === 0) {
    return (
      <EmptyState
        title="No service packages yet"
        description="Create a reusable package to speed up quote generation."
        action={
          <Link
            href="/service-packages/new"
            className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Create service package
          </Link>
        }
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Service Packages</h2>
          <p className="text-sm text-zinc-600">Open a package to review structure and pricing.</p>
        </div>
        <Link
          href="/service-packages/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Create service package
        </Link>
      </div>

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {result.data.servicePackages.map((servicePackage) => (
          <li key={servicePackage.id}>
            <Link
              href={`/service-packages/${servicePackage.id}?backTo=/service-packages`}
              className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              <span>
                <span className="block text-sm font-semibold text-zinc-900">
                  {servicePackage.name}
                </span>
                <span className="block text-sm text-zinc-600">
                  {servicePackage.category} · Starts at {servicePackage.startingPriceLabel}
                </span>
                {servicePackage.shortDescription ? (
                  <span className="block text-sm text-zinc-500">
                    {servicePackage.shortDescription}
                  </span>
                ) : null}
              </span>
              <span className="text-xs text-zinc-500">Open</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
