import { requireSession } from "@/features/auth/require-session";
import { getInvoiceById } from "@/features/invoices/server/invoices-repository";
import type { InvoiceDetailRecord } from "@/features/invoices/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

export async function getInvoice(
  invoiceId: string,
): Promise<ActionResult<{ invoice: InvoiceDetailRecord }>> {
  try {
    const session = await requireSession();

    const invoice = await getInvoiceById(invoiceId);

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
        message: "Could not load invoice.",
      },
    };
  }
}
