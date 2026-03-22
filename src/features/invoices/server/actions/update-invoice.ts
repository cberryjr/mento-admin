"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/require-session";
import {
  getInvoiceById,
  updateInvoice,
} from "@/features/invoices/server/invoices-repository";
import {
  getUpdateInvoiceFieldErrors,
  updateInvoiceSchema,
} from "@/features/invoices/schemas/update-invoice-schema";
import type { InvoiceDetailRecord } from "@/features/invoices/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";

export type UpdateInvoiceFormInput = {
  invoiceId: string;
  title: string;
  issueDate: string | null;
  dueDate: string | null;
  terms: string;
  paymentInstructions: string;
  sections: Array<{
    id?: string;
    title: string;
    content: string;
    position: number;
    lineItems: Array<{
      id?: string;
      name: string;
      content: string;
      quantity: number;
      unitLabel: string;
      unitPriceCents: number;
      position: number;
    }>;
  }>;
};

export async function updateInvoiceAction(
  input: UpdateInvoiceFormInput,
): Promise<ActionResult<{ invoice: InvoiceDetailRecord }>> {
  try {
    const session = await requireSession();
    const parsed = updateInvoiceSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Please correct the highlighted fields.",
          fieldErrors: getUpdateInvoiceFieldErrors(parsed.error),
        },
      };
    }

    const existingInvoice = await getInvoiceById(parsed.data.invoiceId);

    if (!existingInvoice) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Invoice not found.",
        },
      };
    }

    try {
      ensureStudioAccess(session, existingInvoice.studioId);
    } catch {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Invoice not found.",
        },
      };
    }

    if (existingInvoice.status !== "draft") {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Only draft invoices can be edited.",
        },
      };
    }

    const invoice = await updateInvoice(
      existingInvoice.id,
      existingInvoice.studioId,
      {
        title: parsed.data.title,
        issueDate: parsed.data.issueDate,
        dueDate: parsed.data.dueDate,
        terms: parsed.data.terms,
        paymentInstructions: parsed.data.paymentInstructions,
        sections: parsed.data.sections,
      },
    );

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoice.id}`);

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
        message: "Could not update invoice.",
      },
    };
  }
}
