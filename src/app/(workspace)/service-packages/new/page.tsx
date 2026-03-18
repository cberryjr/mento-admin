import Link from "next/link";

import { ServicePackageForm } from "@/features/service-packages/components/service-package-form";
import { createServicePackage } from "@/features/service-packages/server/actions/create-service-package";

export default function NewServicePackagePage() {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Create service package</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Save a reusable package definition that future quote workflows can build from.
          </p>
        </div>
        <Link
          href="/service-packages"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Back to service packages
        </Link>
      </div>

      <ServicePackageForm mode="create" initialValues={null} submitAction={createServicePackage} />
    </section>
  );
}
