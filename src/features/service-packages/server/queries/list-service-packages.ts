import type { ActionResult } from "@/lib/validation/action-result";
import {
  servicePackageFixtures,
  type ServicePackageSummary,
} from "./service-package-fixtures";

export async function listServicePackages(): Promise<
  ActionResult<{ servicePackages: ServicePackageSummary[] }> & {
    meta?: { total: number };
  }
> {
  return {
    ok: true,
    data: {
      servicePackages: servicePackageFixtures,
    },
    meta: {
      total: servicePackageFixtures.length,
    },
  };
}
