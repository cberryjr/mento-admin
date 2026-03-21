"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/require-session";
import { getQuoteById } from "@/features/quotes/server/queries/get-quote-by-id";
import {
  loadQuoteSectionsForEditing,
  saveQuoteSections,
  updateQuoteTimestamp,
} from "@/features/quotes/server/quotes-repository";
import type { QuoteDetailRecord } from "@/features/quotes/types";
import {
  calculateLineTotalCents,
  recalculateQuoteTotals,
} from "@/features/quotes/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

function revalidateQuotePaths(quoteId: string) {
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function updateQuoteLineItem(
  quoteId: string,
  sectionId: string,
  lineItemId: string,
  name: string,
  content: string,
  quantity: number,
  unitLabel: string,
  unitPriceCents: number,
): Promise<ActionResult<{ quote: QuoteDetailRecord }>> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    if (!quoteId?.trim() || !sectionId?.trim() || !lineItemId?.trim()) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Quote ID, section ID, and line item ID are required.",
        },
      };
    }

    if (!name?.trim()) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Line item name is required.",
        },
      };
    }

    if (quantity < 1) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Quantity must be at least 1.",
        },
      };
    }

    if (unitPriceCents < 0) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Unit price must be zero or positive.",
        },
      };
    }

    const quoteResult = await getQuoteById(quoteId);

    if (!quoteResult.ok) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Quote not found.",
        },
      };
    }

    const { quote } = quoteResult.data;

    if (quote.status !== "draft") {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Only draft quotes can be edited.",
        },
      };
    }

    const existingSections = await loadQuoteSectionsForEditing(quote.id);
    const sectionIndex = existingSections.findIndex((s) => s.id === sectionId);

    if (sectionIndex === -1) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Section not found in this quote.",
        },
      };
    }

    const section = existingSections[sectionIndex];

    if (!section.lineItems.some((li) => li.id === lineItemId)) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Line item not found in this section.",
        },
      };
    }

    const sections = recalculateQuoteTotals(
      existingSections.map((s) => {
        if (s.id !== sectionId) return s;

        return {
          ...s,
          lineItems: s.lineItems.map((li) => {
            if (li.id !== lineItemId) return li;

            return {
              ...li,
              name: name.trim(),
              content: content.trim(),
              quantity,
              unitLabel: unitLabel.trim(),
              unitPriceCents,
              lineTotalCents: calculateLineTotalCents(quantity, unitPriceCents),
            };
          }),
        };
      }),
    );

    await saveQuoteSections(quote.id, session.user.studioId, sections);
    await updateQuoteTimestamp(quote.id);
    revalidateQuotePaths(quote.id);

    const updatedQuote = await getQuoteById(quote.id);

    if (!updatedQuote.ok) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Line item was updated but quote could not be reloaded.",
        },
      };
    }

    return {
      ok: true,
      data: { quote: updatedQuote.data.quote },
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        ok: false,
        error: { code: error.code, message: error.message },
      };
    }

    return {
      ok: false,
      error: {
        code: ERROR_CODES.UNKNOWN,
        message: "Could not update line item.",
      },
    };
  }
}
