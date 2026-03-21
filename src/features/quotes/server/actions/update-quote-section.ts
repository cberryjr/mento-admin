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
  recalculateQuoteTotals,
  type QuoteDetailRecord,
} from "@/features/quotes/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

function revalidateQuotePaths(quoteId: string) {
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function updateQuoteSection(
  quoteId: string,
  sectionId: string,
  title: string,
  content: string,
): Promise<ActionResult<{ quote: QuoteDetailRecord }>> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    if (!quoteId?.trim() || !sectionId?.trim()) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Quote ID and section ID are required.",
        },
      };
    }

    if (!title?.trim()) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Section title is required.",
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

    const sections = recalculateQuoteTotals(
      existingSections.map((s) =>
        s.id === sectionId ? { ...s, title: title.trim(), content: content.trim() } : s,
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
          message: "Section was updated but quote could not be reloaded.",
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
        message: "Could not update section.",
      },
    };
  }
}
