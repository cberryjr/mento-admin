import type { ActionResult } from "@/lib/validation/action-result";
import { requireSession } from "@/features/auth/require-session";
import {
  getQuoteById as getQuoteRecordById,
} from "@/features/quotes/server/quotes-repository";
import { syncQuoteEstimateBreakdownSnapshot } from "@/features/quotes/server/estimate-breakdown-snapshot";
import type { QuoteDetailRecord } from "@/features/quotes/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { ensureStudioAccess } from "@/server/auth/permissions";

export async function getQuoteById(
  quoteId: string,
): Promise<ActionResult<{ quote: QuoteDetailRecord }>> {
  try {
    const session = await requireSession();
    const quote = await getQuoteRecordById(quoteId);

    if (!quote) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Quote not found.",
        },
      };
    }

    // Return the same "not found" message regardless of whether the quote
    // belongs to another studio to prevent IDOR enumeration.
    try {
      ensureStudioAccess(session, quote.studioId);
    } catch {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Quote not found.",
        },
      };
    }

    const estimateBreakdown = await syncQuoteEstimateBreakdownSnapshot(quote);

    return {
      ok: true,
      data: {
        quote: {
          ...quote,
          estimateBreakdown,
        },
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
        message: "Could not load quote.",
      },
    };
  }
}
