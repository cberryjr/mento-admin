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
  reorderQuoteSectionsSchema,
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

export async function reorderQuoteSections(
  quoteId: string,
  sectionIds: string[],
): Promise<ActionResult<{ quote: QuoteDetailRecord }>> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    const parsed = reorderQuoteSectionsSchema.safeParse({ quoteId, sectionIds });

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
    const existingIds = new Set(existingSections.map((s) => s.id));

    for (const id of parsed.data.sectionIds) {
      if (!existingIds.has(id)) {
        return {
          ok: false,
          error: {
            code: ERROR_CODES.UNKNOWN,
            message: "One or more sections do not belong to this quote.",
          },
        };
      }
    }

    if (parsed.data.sectionIds.length !== existingSections.length) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "All sections must be included in the reorder.",
        },
      };
    }

    const reordered = parsed.data.sectionIds.map((id, index) => {
      const section = existingSections.find((s) => s.id === id)!;
      return { ...section, position: index + 1 };
    });

    const sections = recalculateQuoteTotals(reordered);

    await saveQuoteSections(quote.id, session.user.studioId, sections);
    await updateQuoteTimestamp(quote.id);
    revalidateQuotePaths(quote.id);

    const updatedQuote = await getQuoteById(quote.id);

    if (!updatedQuote.ok) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Sections were reordered but quote could not be reloaded.",
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
        message: "Could not reorder sections.",
      },
    };
  }
}
