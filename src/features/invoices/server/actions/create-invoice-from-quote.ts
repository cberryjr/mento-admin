"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/features/auth/require-session";
import {
  createInvoiceFromQuote,
} from "@/features/invoices/server/invoices-repository";
import type { InvoiceDetailRecord } from "@/features/invoices/types";
import {
  getQuoteById,
  updateQuoteStatus,
} from "@/features/quotes/server/quotes-repository";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

const createInvoiceFromQuoteSchema = z.object({
  quoteId: z.string().min(1),
});

type CreateInvoiceFromQuoteInput = z.input<
  typeof createInvoiceFromQuoteSchema
>;

export async function createInvoiceFromQuoteAction(
  input: CreateInvoiceFromQuoteInput,
): Promise<ActionResult<{ invoice: InvoiceDetailRecord }>> {
  try {
    const session = await requireSession();
    const parsed = createInvoiceFromQuoteSchema.safeParse(input);

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

    if (quote.status !== "accepted") {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Only accepted quotes can be converted to invoices.",
        },
      };
    }

    const invoice = await createInvoiceFromQuote(
      quote.studioId,
      quote.id,
    );

    await updateQuoteStatus(quote.id, "invoiced");

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoice.id}`);
    revalidatePath("/quotes");
    revalidatePath(`/quotes/${quote.id}`);

    return {
      ok: true,
      data: { invoice },
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
        message: "Could not convert quote to invoice.",
      },
    };
  }
}
