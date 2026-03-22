import type { ActionResult } from "@/lib/validation/action-result";
import { requireSession } from "@/features/auth/require-session";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { ensureStudioAccess } from "@/server/auth/permissions";

export type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  title: string;
  status: "draft" | "sent" | "paid";
  updatedAt: string;
};

export async function listInvoices(): Promise<
  ActionResult<{ invoices: InvoiceSummary[] }> & { meta?: { total: number } }
> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    // TODO: Replace with repository query when invoice persistence is implemented.
    const invoices: InvoiceSummary[] = [];

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
