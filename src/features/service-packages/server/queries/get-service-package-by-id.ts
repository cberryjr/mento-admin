import type { ActionResult } from "@/lib/validation/action-result";
import { requireSession } from "@/features/auth/require-session";
import {
  getServicePackageById as getServicePackageRecordById,
} from "@/features/service-packages/server/service-packages-repository";
import type { ServicePackageRecord } from "@/features/service-packages/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { ensureStudioAccess } from "@/server/auth/permissions";

export async function getServicePackageById(
  servicePackageId: string,
): Promise<ActionResult<{ servicePackage: ServicePackageRecord }>> {
  try {
    const session = await requireSession();
    const servicePackage = await getServicePackageRecordById(servicePackageId);

    if (!servicePackage) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Service package not found.",
        },
      };
    }

    ensureStudioAccess(session, servicePackage.studioId);

    return {
      ok: true,
      data: {
        servicePackage,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: ERROR_CODES.UNKNOWN,
        message: "Could not load service package.",
      },
    };
  }
}
