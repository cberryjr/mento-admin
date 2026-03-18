import type { ActionResult } from "@/lib/validation/action-result";
import { requireSession } from "@/features/auth/require-session";
import {
  listServicePackagesForStudio,
} from "@/features/service-packages/server/service-packages-repository";
import {
  toServicePackageSummary,
  type ServicePackageSummary,
} from "@/features/service-packages/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { ensureStudioAccess } from "@/server/auth/permissions";

export async function listServicePackages(): Promise<
  ActionResult<{ servicePackages: ServicePackageSummary[] }> & {
    meta?: { total: number };
  }
> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    const servicePackages = (await listServicePackagesForStudio(
      session.user.studioId,
    )).map(toServicePackageSummary);

    return {
      ok: true,
      data: {
        servicePackages,
      },
      meta: {
        total: servicePackages.length,
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
        message: "Could not load service packages.",
      },
    };
  }
}
