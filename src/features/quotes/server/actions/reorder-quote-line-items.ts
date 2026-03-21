"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/require-session";
import { getQuoteById } from "@/features/quotes/server/queries/get-quote-by-id";
import {
  loadQuoteSectionsForEditing,
  saveQuoteSections,
  updateQuoteTimestamp,
} from "@/features/quotes/server/quotes-repository";
import {
  reorderQuoteLineItemsSchema,
} from "@/features/quotes/schemas/update-quote-sections-schema";
import type { QuoteDetailRecord } from "@/features/quotes/types";
import { recalculateQuoteTotals } from "@/features/quotes/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

function revalidateQuotePaths(quoteId: string) {
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function reorderQuoteLineItems(
  quoteId: string,
  sectionId: string,
  lineItemIds: string[],
): Promise<ActionResult<{ quote: QuoteDetailRecord }>> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    const parsed = reorderQuoteLineItemsSchema.safeParse({
      quoteId,
      sectionId,
      lineItemIds,
    });

    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: parsed.error.issues[0]?.message ?? "Invalid reorder input.",
        },
      };
    }

    const quoteResult = await getQuoteById(parsed.data.quoteId);

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
          message: "Only draft quotes can be reordered.",
        },
      };
    }

    const existingSections = await loadQuoteSectionsForEditing(quote.id);
    const sectionIndex = existingSections.findIndex(
      (s) => s.id === parsed.data.sectionId,
    );

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
    const existingItemIds = new Set(section.lineItems.map((li) => li.id));

    for (const id of parsed.data.lineItemIds) {
      if (!existingItemIds.has(id)) {
        return {
          ok: false,
          error: {
            code: ERROR_CODES.UNKNOWN,
            message: "One or more line items do not belong to this section.",
          },
        };
      }
    }

    if (parsed.data.lineItemIds.length !== section.lineItems.length) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "All line items must be included in the reorder.",
        },
      };
    }

    const reorderedItems = parsed.data.lineItemIds.map((id, index) => {
      const item = section.lineItems.find((li) => li.id === id)!;
      return { ...item, position: index + 1 };
    });

    const sections = recalculateQuoteTotals(
      existingSections.map((s, i) =>
        i === sectionIndex ? { ...s, lineItems: reorderedItems } : s,
      ),
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
          message: "Line items were reordered but quote could not be reloaded.",
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
        message: "Could not reorder line items.",
      },
    };
  }
}
