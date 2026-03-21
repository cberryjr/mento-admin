import type { ActionResult } from "@/lib/validation/action-result";
import { requireSession } from "@/features/auth/require-session";
import {
  getServicePackageForStudioById,
} from "@/features/service-packages/server/service-packages-repository";
import type { ServicePackageDetailRecord } from "@/features/service-packages/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";

export async function getServicePackageById(
  servicePackageId: string,
): Promise<ActionResult<{ servicePackage: ServicePackageDetailRecord }>> {
  try {
    const session = await requireSession();
    const servicePackage = await getServicePackageForStudioById(
      session.user.studioId,
      servicePackageId,
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
