import type { ActionResult } from "@/lib/validation/action-result";
import { requireSession } from "@/features/auth/require-session";
import {
  listQuotesForStudio,
} from "@/features/quotes/server/quotes-repository";
import {
  toQuoteSummary,
  type QuoteSummary,
} from "@/features/quotes/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { ensureStudioAccess } from "@/server/auth/permissions";

export type { QuoteSummary } from "@/features/quotes/types";

export async function listQuotes(): Promise<
  ActionResult<{ quotes: QuoteSummary[] }> & { meta?: { total: number } }
> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    const quotes = (await listQuotesForStudio(session.user.studioId)).map(
      toQuoteSummary,
    );

    return {
      ok: true,
      data: {
        quotes,
      },
      meta: {
        total: quotes.length,
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
        message: "Could not load quotes.",
      },
    };
  }
}
