"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/features/auth/require-session";
import {
  getQuoteById,
  updateQuoteStatus,
} from "@/features/quotes/server/quotes-repository";
import type { QuoteDetailRecord } from "@/features/quotes/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

const markQuoteAcceptedSchema = z.object({
  quoteId: z.string().min(1),
});

type MarkQuoteAcceptedInput = z.input<typeof markQuoteAcceptedSchema>;

export async function markQuoteAccepted(
  input: MarkQuoteAcceptedInput,
): Promise<ActionResult<{ quote: QuoteDetailRecord }>> {
  try {
    const session = await requireSession();
    const parsed = markQuoteAcceptedSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Please correct the highlighted fields.",
          fieldErrors: parsed.error.flatten().fieldErrors,
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

    if (quote.status !== "draft") {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Only draft quotes can be marked as accepted.",
        },
      };
    }

    if (quote.sections.length === 0) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Generate quote content before marking as accepted.",
        },
      };
    }

    const updatedQuote = await updateQuoteStatus(quote.id, "accepted");

    if (!updatedQuote) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Quote not found.",
        },
      };
    }

    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quote.id}`);
    revalidatePath(`/quotes/${quote.id}/preview`);
    revalidatePath(`/quotes/${quote.id}/revisions`);

    return {
      ok: true,
      data: { quote: updatedQuote },
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
        message: "Could not mark quote as accepted.",
      },
    };
  }
}
