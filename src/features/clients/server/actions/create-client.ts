"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/require-session";
import { createClientRecord } from "@/features/clients/server/clients-repository";
import {
  clientSchema,
  type ClientSchemaInput,
} from "@/features/clients/schemas/client-schema";
import type { ClientRecord } from "@/features/clients/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

function revalidateClientPaths(clientId: string) {
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function createClient(
  input: ClientSchemaInput,
): Promise<ActionResult<{ client: ClientRecord }>> {
  // Auth check first, per architecture pattern: "authentication and authorization
  // checks before domain work begins."
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    const parsed = clientSchema.safeParse(input);

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

    const client = await createClientRecord(session.user.studioId, parsed.data);
    revalidateClientPaths(client.id);

    return {
      ok: true,
      data: {
        client,
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
        message: "Could not save client.",
      },
    };
  }
}

