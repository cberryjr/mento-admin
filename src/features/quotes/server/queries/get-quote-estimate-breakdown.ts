import type { ActionResult } from "@/lib/validation/action-result";
import { getQuoteById } from "@/features/quotes/server/queries/get-quote-by-id";
import type { EstimateBreakdownPayload } from "@/features/quotes/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";

export async function getQuoteEstimateBreakdown(
  quoteId: string,
): Promise<ActionResult<EstimateBreakdownPayload>> {
  try {
    const quoteResult = await getQuoteById(quoteId);

    if (!quoteResult.ok) {
      return {
        ok: false,
        error: quoteResult.error,
      };
    }

    if (!quoteResult.data.quote.estimateBreakdown) {
      if (quoteResult.data.quote.sections.length === 0) {
        return {
          ok: true,
          data: {
            quoteId: quoteResult.data.quote.id,
            computedAt: new Date().toISOString(),
            sectionBreakdowns: [],
            grandTotal: {
              estimatedHours: { min: 0, max: 0 },
              roleBreakdown: [],
              internalCostCents: 0,
              marginPercent: 0,
              marginCents: 0,
              finalPriceCents: 0,
              deliverables: [],
            },
          },
        };
      }

      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Estimate breakdown could not be refreshed from the saved quote snapshot.",
        },
      };
    }

    return {
      ok: true,
      data: quoteResult.data.quote.estimateBreakdown,
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
        message: "Could not compute estimate breakdown.",
      },
    };
  }
}
