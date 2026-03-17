import type { ActionResult } from "@/lib/validation/action-result";
import { requireSession } from "@/features/auth/require-session";
import {
  buildClientDetailRecord,
  getClientById as getClientRecordById,
} from "@/features/clients/server/clients-repository";
import type { ClientDetailRecord } from "@/features/clients/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { ensureStudioAccess } from "@/server/auth/permissions";

export async function getClientById(
  clientId: string,
): Promise<ActionResult<ClientDetailRecord>> {
  try {
    const session = await requireSession();

    // Un-scoped lookup so we can distinguish "not found" from "forbidden".
    const client = await getClientRecordById(clientId);

    if (!client) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Client not found.",
        },
      };
    }

    // Single, explicit studio authorization check - the only auth gate on this path.
    ensureStudioAccess(session, client.studioId);

    return {
      ok: true,
      data: await buildClientDetailRecord(session.user.studioId, client),
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
        message: "Could not load client.",
      },
    };
  }
}
