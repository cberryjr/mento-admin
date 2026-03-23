"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/features/auth/require-session";
import { getClientByIdForStudio } from "@/features/clients/server/clients-repository";
import { emitCorrectionEvent } from "@/features/corrections/server/correction-events";
import {
  getQuoteById,
  saveQuoteSections,
  updateQuoteRecord,
  updateQuoteStatus,
  updateQuoteTimestamp,
} from "@/features/quotes/server/quotes-repository";
import type {
  QuoteDetailRecord,
  QuoteLineItemRecord,
} from "@/features/quotes/types";
import { recalculateQuoteTotals } from "@/features/quotes/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

function isValidCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const nullableDateSchema = z
  .union([z.string().trim(), z.null(), z.undefined()])
  .transform((value) => (value === undefined || value === "" ? null : value))
  .refine(
    (value) => value === null || isValidCalendarDate(value),
    "Enter a valid date in YYYY-MM-DD format.",
  );

const quoteLineItemCorrectionSchema = z.object({
  id: z.string().trim().min(1, "Line item ID is required."),
  description: z.string().trim().max(2000, "Line item content must be 2000 characters or fewer.").optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1.").optional(),
  unitPriceCents: z.number().int().min(0, "Unit price must be zero or positive.").optional(),
  unitLabel: z.string().trim().max(40, "Unit label must be 40 characters or fewer.").optional(),
  name: z.string().trim().min(1, "Line item name is required.").max(160, "Line item name must be 160 characters or fewer.").optional(),
}).strict();

const quoteSectionCorrectionSchema = z.object({
  id: z.string().trim().min(1, "Section ID is required."),
  description: z.string().trim().max(2000, "Section content must be 2000 characters or fewer.").optional(),
  lineItems: z.array(quoteLineItemCorrectionSchema).optional(),
  title: z.string().trim().min(1, "Section title is required.").max(160, "Section title must be 160 characters or fewer.").optional(),
}).strict();

const correctQuoteDataSchema = z.object({
  quoteId: z.string().trim().min(1, "Quote ID is required."),
  corrections: z.object({
    clientId: z.string().trim().min(1, "Client ID is required.").optional(),
    dates: z
      .object({
        issueDate: nullableDateSchema.optional(),
        validUntil: nullableDateSchema.optional(),
      })
      .optional(),
    sections: z.array(quoteSectionCorrectionSchema).optional(),
    status: z.enum(["draft", "accepted"]).optional(),
    terms: z.string().trim().max(2000, "Terms must be 2000 characters or fewer.").optional(),
  }).strict(),
}).strict();

type CorrectQuoteDataInput = z.input<typeof correctQuoteDataSchema>;
type CorrectQuoteDataData = z.output<typeof correctQuoteDataSchema>;
type QuoteSectionCorrection = NonNullable<CorrectQuoteDataData["corrections"]["sections"]>[number];
type QuoteLineItemCorrection = NonNullable<QuoteSectionCorrection["lineItems"]>[number];

function pushFieldError(
  fieldErrors: Record<string, string[]>,
  key: string,
  message: string,
) {
  if (!fieldErrors[key]) {
    fieldErrors[key] = [];
  }

  fieldErrors[key].push(message);
}

function getFieldErrors(error: z.ZodError<CorrectQuoteDataInput>) {
  return error.issues.reduce<Record<string, string[]>>((fieldErrors, issue) => {
    const path = Array.from(issue.path).filter(
      (value): value is string | number =>
        typeof value === "string" || typeof value === "number",
    );

    if (path.length === 0) {
      pushFieldError(fieldErrors, "form", issue.message);
      return fieldErrors;
    }

    pushFieldError(fieldErrors, path.map(String).join("."), issue.message);
    return fieldErrors;
  }, {});
}

function applyLineItemCorrection(
  lineItem: QuoteLineItemRecord,
  correction: QuoteLineItemCorrection,
): QuoteLineItemRecord {
  return {
    ...lineItem,
    content: correction.description ?? lineItem.content,
    name: correction.name ?? lineItem.name,
    quantity: correction.quantity ?? lineItem.quantity,
    unitLabel: correction.unitLabel ?? lineItem.unitLabel,
    unitPriceCents: correction.unitPriceCents ?? lineItem.unitPriceCents,
  };
}

function applySectionCorrections(
  quote: QuoteDetailRecord,
  corrections: CorrectQuoteDataData["corrections"],
) {
  const fieldErrors: Record<string, string[]> = {};

  if (!corrections.sections || corrections.sections.length === 0) {
    return { fieldErrors, sections: quote.sections };
  }

  const sectionCorrections = new Map(
    corrections.sections.map((section, sectionIndex) => [section.id, { section, sectionIndex }]),
  );

  for (const [sectionId, { sectionIndex }] of sectionCorrections.entries()) {
    if (!quote.sections.some((section) => section.id === sectionId)) {
      pushFieldError(fieldErrors, `corrections.sections.${sectionIndex}.id`, "Section not found.");
    }
  }

  const sections = recalculateQuoteTotals(
    quote.sections.map((section) => {
      const entry = sectionCorrections.get(section.id);

      if (!entry) {
        return section;
      }

      const lineItemCorrections = new Map(
        (entry.section.lineItems ?? []).map((lineItem, lineItemIndex) => [
          lineItem.id,
          { lineItem, lineItemIndex },
        ]),
      );

      for (const [lineItemId, { lineItemIndex }] of lineItemCorrections.entries()) {
        if (!section.lineItems.some((lineItem) => lineItem.id === lineItemId)) {
          pushFieldError(
            fieldErrors,
            `corrections.sections.${entry.sectionIndex}.lineItems.${lineItemIndex}.id`,
            "Line item not found.",
          );
        }
      }

      return {
        ...section,
        content: entry.section.description ?? section.content,
        title: entry.section.title ?? section.title,
        lineItems: section.lineItems.map((lineItem) => {
          const lineItemEntry = lineItemCorrections.get(lineItem.id);
          return lineItemEntry
            ? applyLineItemCorrection(lineItem, lineItemEntry.lineItem)
            : lineItem;
        }),
      };
    }),
  );

  return { fieldErrors, sections };
}

function revalidateQuotePaths(quoteId: string) {
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath(`/quotes/${quoteId}/preview`);
  revalidatePath(`/quotes/${quoteId}/revisions`);
  revalidatePath("/records/history");
}

export async function correctQuoteData(
  input: CorrectQuoteDataInput,
): Promise<ActionResult<{ quote: QuoteDetailRecord }>> {
  try {
    const session = await requireSession();
    const parsed = correctQuoteDataSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Please correct the highlighted fields.",
          fieldErrors: getFieldErrors(parsed.error),
        },
      };
    }

    const quote = await getQuoteById(parsed.data.quoteId);

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

    const fieldErrors: Record<string, string[]> = {};
    const { corrections } = parsed.data;

    if (corrections.clientId) {
      const client = await getClientByIdForStudio(quote.studioId, corrections.clientId);

      if (!client) {
        pushFieldError(fieldErrors, "corrections.clientId", "Select a client from your studio.");
      }
    }

    if (corrections.dates) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Quote date correction is not available for the current quote model.",
          fieldErrors: {
            "corrections.dates": [
              "Quote date correction is not available for the current quote model.",
            ],
          },
        },
      };
    }

    if (quote.status === "invoiced" && corrections.status) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Invoiced quotes cannot change status during correction.",
        },
      };
    }

    const sectionResult = applySectionCorrections(quote, corrections);

    for (const [key, messages] of Object.entries(sectionResult.fieldErrors)) {
      for (const message of messages) {
        pushFieldError(fieldErrors, key, message);
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Please correct the highlighted fields.",
          fieldErrors,
        },
      };
    }

    const clientId = corrections.clientId ?? quote.clientId;
    const terms = corrections.terms ?? quote.terms;
    const nextStatus = corrections.status ?? quote.status;

    const updatedQuoteRecord = await updateQuoteRecord(quote.studioId, quote.id, {
      clientId,
      selectedServicePackageIds: quote.selectedServicePackageIds,
      terms,
      title: quote.title,
    });

    if (!updatedQuoteRecord) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Quote not found.",
        },
      };
    }

    await saveQuoteSections(quote.id, quote.studioId, sectionResult.sections);

    if (nextStatus !== quote.status) {
      const updatedStatusQuote = await updateQuoteStatus(quote.id, nextStatus);

      if (!updatedStatusQuote) {
        return {
          ok: false,
          error: {
            code: ERROR_CODES.UNKNOWN,
            message: "Quote not found.",
          },
        };
      }
    } else {
      await updateQuoteTimestamp(quote.id);
    }

    const updatedQuote = await getQuoteById(quote.id);

    if (!updatedQuote) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Quote was corrected but could not be reloaded.",
        },
      };
    }

    await emitCorrectionEvent({
      type: "quote.corrected",
      recordId: quote.id,
      studioId: quote.studioId,
    });
    revalidateQuotePaths(quote.id);

    return {
      ok: true,
      data: { quote: updatedQuote },
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
        message: "Could not correct quote data.",
      },
    };
  }
}
