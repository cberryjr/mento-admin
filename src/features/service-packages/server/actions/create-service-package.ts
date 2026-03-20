"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/require-session";
import { createServicePackageRecord } from "@/features/service-packages/server/service-packages-repository";
import {
  getServicePackageFieldErrors,
  servicePackageSchema,
  type ServicePackageSchemaInput,
} from "@/features/service-packages/schemas/service-package-schema";
import type { ServicePackageDetailRecord } from "@/features/service-packages/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

function revalidateServicePackagePaths(servicePackageId: string) {
  revalidatePath("/service-packages");
  revalidatePath(`/service-packages/${servicePackageId}`);
}

export async function createServicePackage(
  input: ServicePackageSchemaInput,
): Promise<ActionResult<{ servicePackage: ServicePackageDetailRecord }>> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    const parsed = servicePackageSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Please correct the highlighted fields.",
          fieldErrors: getServicePackageFieldErrors(input, parsed.error),
        },
      };
    }

    const servicePackage = await createServicePackageRecord(session.user.studioId, parsed.data);
    revalidateServicePackagePaths(servicePackage.id);

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
        message: "Could not save service package.",
      },
    };
  }
}
