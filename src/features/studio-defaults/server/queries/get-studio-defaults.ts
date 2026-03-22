import { requireSession } from "@/features/auth/require-session";
import { ensureStudioOwner } from "@/server/auth/permissions";
import type { ActionResult } from "@/lib/validation/action-result";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { loadStudioDefaults } from "@/features/studio-defaults/server/studio-defaults-repository";
import type { StudioDefaultsRecord } from "@/features/studio-defaults/types";

export async function getStudioDefaults(): Promise<
  ActionResult<{ studioDefaults: StudioDefaultsRecord | null }>
> {
  try {
    const session = await requireSession();
    ensureStudioOwner(session);

    const studioDefaults = await loadStudioDefaults(session.user.studioId);

    return {
      ok: true,
      data: {
        studioDefaults,
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
        message: "Could not load studio defaults.",
      },
    };
  }
}
