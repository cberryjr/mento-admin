"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/require-session";
import {
  createQuoteRevision,
  getQuoteById as getQuoteRecordById,
  loadQuoteSectionsForEditing,
  saveQuoteSections,
  updateQuoteTimestamp,
} from "@/features/quotes/server/quotes-repository";
import {
  getUpdateQuoteSectionsFieldErrors,
  updateQuoteSectionsSchema,
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
      const existing = existingSections.find((candidate) => candidate.id === sectionId);

      const lineItems: QuoteLineItemRecord[] = section.lineItems.map(
        (lineItem, lineItemIndex) => ({
          id: lineItem.id ?? randomUUID(),
          quoteId,
          quoteSectionId: sectionId,
          studioId,
          name: lineItem.name,
          content: lineItem.content,
          quantity: lineItem.quantity,
          unitLabel: lineItem.unitLabel,
          unitPriceCents: lineItem.unitPriceCents,
          lineTotalCents: calculateLineTotalCents(
            lineItem.quantity,
            lineItem.unitPriceCents,
          ),
          position: lineItemIndex + 1,
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

export async function reviseQuote(
  input: UpdateQuoteSectionsSchemaInput,
): Promise<ActionResult<{ revisionNumber: number; quote: QuoteDetailRecord }>> {
  try {
    const session = await requireSession();

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

    const quote = await getQuoteRecordById(parsed.data.quoteId);

    if (!quote) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Quote not found.",
        },
      };
    }

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

    if (quote.status !== "draft") {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Only draft quotes can be revised.",
        },
      };
    }

    const existingSections = await loadQuoteSectionsForEditing(quote.id);
    const revision = await createQuoteRevision(quote.id, session.user.studioId);

    if (!revision) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Could not create a revision snapshot.",
        },
      };
    }

    const sections = buildSectionsFromInput(
      quote.id,
      session.user.studioId,
      parsed.data.sections,
      existingSections,
    );

    await saveQuoteSections(quote.id, session.user.studioId, sections);
    await updateQuoteTimestamp(quote.id);
    revalidateQuotePaths(quote.id);

    return {
      ok: true,
      data: {
        revisionNumber: revision.revisionNumber,
        quote: {
          ...quote,
          sections,
          updatedAt: new Date().toISOString(),
        },
      },
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
        message: "Could not save revision.",
      },
    };
  }
}
