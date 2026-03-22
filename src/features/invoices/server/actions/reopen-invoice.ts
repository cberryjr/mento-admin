"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/features/auth/require-session";
import {
  getInvoiceById,
  updateInvoiceStatus,
} from "@/features/invoices/server/invoices-repository";
import type { InvoiceDetailRecord } from "@/features/invoices/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

const reopenInvoiceSchema = z.object({
  invoiceId: z.string().min(1),
});

type ReopenInvoiceInput = z.input<typeof reopenInvoiceSchema>;

export async function reopenInvoiceAction(
  input: ReopenInvoiceInput,
): Promise<ActionResult<{ invoice: InvoiceDetailRecord }>> {
  try {
    const session = await requireSession();
    const parsed = reopenInvoiceSchema.safeParse(input);

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

    const invoice = await getInvoiceById(parsed.data.invoiceId);

    if (!invoice) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Invoice not found.",
        },
      };
    }

    try {
      ensureStudioAccess(session, invoice.studioId);
    } catch {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Invoice not found.",
        },
      };
    }

    if (invoice.status === "draft") {
      return {
        ok: true,
        data: { invoice },
      };
    }

    const updatedInvoice = await updateInvoiceStatus(invoice.id, "draft");

    if (!updatedInvoice) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Invoice not found.",
        },
      };
    }

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoice.id}`);

    return {
      ok: true,
      data: { invoice: updatedInvoice },
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
        message: "Could not reopen invoice.",
      },
    };
  }
}
