import type { ActionResult } from "@/lib/validation/action-result";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import {
  servicePackageFixtures,
  type ServicePackageSummary,
} from "./service-package-fixtures";

export async function getServicePackageById(
  servicePackageId: string,
): Promise<ActionResult<{ servicePackage: ServicePackageSummary }>> {
  const servicePackage = servicePackageFixtures.find(
    (item) => item.id === servicePackageId,
  );

  if (!servicePackage) {
    return {
      ok: false,
      error: {
        code: ERROR_CODES.UNKNOWN,
        message: "Service package not found.",
      },
    };
  }

  return {
    ok: true,
    data: {
      servicePackage,
    },
  };
}
