"use server";

import { requireSession } from "@/features/auth/require-session";
import { ensureStudioOwner } from "@/server/auth/permissions";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import {
  studioDefaultsSchema,
  toStudioDefaultsInput,
  type StudioDefaultsSchemaInput,
} from "@/features/studio-defaults/schemas/studio-defaults-schema";
import { saveStudioDefaults } from "@/features/studio-defaults/server/studio-defaults-repository";
import type { StudioDefaultsRecord } from "@/features/studio-defaults/types";

export async function updateStudioDefaults(
  input: StudioDefaultsSchemaInput,
): Promise<ActionResult<{ studioDefaults: StudioDefaultsRecord }>> {
  const parsed = studioDefaultsSchema.safeParse(input);

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

  try {
    const session = await requireSession();
    ensureStudioOwner(session);

    const studioDefaults = await saveStudioDefaults(
      session.user.studioId,
      parsed.data,
    );

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
        message: "Could not save studio defaults.",
      },
    };
  }
}

export async function updateStudioDefaultsFromFormData(
  formData: FormData,
): Promise<ActionResult<{ studioDefaults: StudioDefaultsRecord }>> {
  return updateStudioDefaults(toStudioDefaultsInput(formData));
}
