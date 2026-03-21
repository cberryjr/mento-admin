"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/require-session";
import { getQuoteById } from "@/features/quotes/server/queries/get-quote-by-id";
import {
  loadQuoteSectionsForEditing,
  saveQuoteSections,
  updateQuoteTimestamp,
} from "@/features/quotes/server/quotes-repository";
import {
  updateQuoteSectionsSchema,
  getUpdateQuoteSectionsFieldErrors,
  type UpdateQuoteSectionsSchemaInput,
} from "@/features/quotes/schemas/update-quote-sections-schema";
import type {
  QuoteDetailRecord,
  QuoteLineItemRecord,
  QuoteSectionRecord,
} from "@/features/quotes/types";
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

function buildSectionsFromInput(
  quoteId: string,
  studioId: string,
  sections: UpdateQuoteSectionsSchemaInput["sections"],
  existingSections: QuoteSectionRecord[],
): QuoteSectionRecord[] {
  return recalculateQuoteTotals(
    sections.map((section, sectionIndex) => {
      const sectionId = section.id ?? randomUUID();
      const existing = existingSections.find((s) => s.id === sectionId);

      const lineItems: QuoteLineItemRecord[] = section.lineItems.map(
        (li, liIndex) => ({
        id: li.id ?? randomUUID(),
        quoteId,
        quoteSectionId: sectionId,
        studioId,
        name: li.name,
        content: li.content,
        quantity: li.quantity,
        unitLabel: li.unitLabel,
        unitPriceCents: li.unitPriceCents,
        lineTotalCents: calculateLineTotalCents(
          li.quantity,
          li.unitPriceCents,
        ),
        position: liIndex + 1,
      }),
    );

    return {
      id: sectionId,
      quoteId,
      studioId,
      sourceServicePackageId:
        section.sourceServicePackageId ?? existing?.sourceServicePackageId ?? "",
        title: section.title,
        content: section.content,
        position: sectionIndex + 1,
        lineItems,
      };
    }),
  );
}

export async function updateQuoteSections(
  input: UpdateQuoteSectionsSchemaInput,
): Promise<ActionResult<{ quote: QuoteDetailRecord }>> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    const parsed = updateQuoteSectionsSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Please correct the highlighted fields.",
          fieldErrors: getUpdateQuoteSectionsFieldErrors(parsed.error),
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
          message: "Only draft quotes can be edited.",
        },
      };
    }

    const existingSections = await loadQuoteSectionsForEditing(quote.id);
    const sections = buildSectionsFromInput(
      quote.id,
      session.user.studioId,
      parsed.data.sections,
      existingSections,
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
          message: "Quote was updated but could not be reloaded.",
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
        message: "Could not update quote sections.",
      },
    };
  }
}
