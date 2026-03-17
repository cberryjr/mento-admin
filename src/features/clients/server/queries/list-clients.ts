import type { ActionResult } from "@/lib/validation/action-result";
import { requireSession } from "@/features/auth/require-session";
import {
  listClientsForStudio,
} from "@/features/clients/server/clients-repository";
import { toClientSummary, type ClientSummary } from "@/features/clients/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { ensureStudioAccess } from "@/server/auth/permissions";

export async function listClients(): Promise<
  ActionResult<{ clients: ClientSummary[] }> & { meta?: { total: number } }
> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    const clients = (await listClientsForStudio(session.user.studioId)).map(toClientSummary);

    return {
      ok: true,
      data: {
        clients,
      },
      meta: {
        total: clients.length,
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
        message: "Could not load clients.",
      },
    };
  }
}
