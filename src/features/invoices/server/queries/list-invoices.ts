import { requireSession } from "@/features/auth/require-session";
import { listInvoicesForStudio } from "@/features/invoices/server/invoices-repository";
import { toInvoiceSummary } from "@/features/invoices/types";
import type { InvoiceSummary } from "@/features/invoices/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

export async function listInvoices(): Promise<
  ActionResult<{ invoices: InvoiceSummary[] }> & { meta?: { total: number } }
> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    const records = await listInvoicesForStudio(session.user.studioId);
    const invoices = records.map(toInvoiceSummary);

    return {
      ok: true,
      data: {
        invoices,
      },
      meta: {
        total: invoices.length,
      },
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
        message: "Could not load invoices.",
      },
    };
  }
}
