"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/require-session";
import {
  getServicePackageById,
  updateServicePackageRecord,
} from "@/features/service-packages/server/service-packages-repository";
import {
  servicePackageSchema,
  type ServicePackageSchemaInput,
} from "@/features/service-packages/schemas/service-package-schema";
import type { ServicePackageRecord } from "@/features/service-packages/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

function revalidateServicePackagePaths(servicePackageId: string) {
  revalidatePath("/service-packages");
  revalidatePath(`/service-packages/${servicePackageId}`);
}

export async function updateServicePackage(
  servicePackageId: string,
  input: ServicePackageSchemaInput,
): Promise<ActionResult<{ servicePackage: ServicePackageRecord }>> {
  try {
    const session = await requireSession();
    const existingServicePackage = await getServicePackageById(servicePackageId);

    if (!existingServicePackage) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Service package not found.",
        },
      };
    }

    ensureStudioAccess(session, existingServicePackage.studioId);

    const parsed = servicePackageSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Please correct the highlighted fields.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
      };
    }

    const servicePackage = await updateServicePackageRecord(
      existingServicePackage.studioId,
      servicePackageId,
      parsed.data,
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
