"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/features/auth/require-session";
import { getClientByIdForStudio } from "@/features/clients/server/clients-repository";
import { emitCorrectionEvent } from "@/features/corrections/server/correction-events";
import {
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
} from "@/features/invoices/server/invoices-repository";
import type {
  InvoiceDetailRecord,
  InvoiceLineItemRecord,
  InvoiceSectionRecord,
} from "@/features/invoices/types";
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

const invoiceLineItemCorrectionSchema = z.object({
  id: z.string().trim().min(1, "Line item ID is required."),
  description: z.string().trim().max(2000, "Line item content must be 2000 characters or fewer.").optional(),
  quantity: z.number().int().positive("Quantity must be greater than zero.").optional(),
  unitPriceCents: z.number().int().min(0, "Unit price cannot be negative.").optional(),
  unitLabel: z.string().trim().max(40, "Unit label must be 40 characters or fewer.").optional(),
  name: z.string().trim().min(1, "Line item name is required.").max(160, "Line item name must be 160 characters or fewer.").optional(),
}).strict();

const invoiceSectionCorrectionSchema = z.object({
  id: z.string().trim().min(1, "Section ID is required."),
  description: z.string().trim().max(2000, "Section content must be 2000 characters or fewer.").optional(),
  lineItems: z.array(invoiceLineItemCorrectionSchema).optional(),
  title: z.string().trim().min(1, "Section title is required.").max(160, "Section title must be 160 characters or fewer.").optional(),
}).strict();

const correctInvoiceDataSchema = z.object({
  invoiceId: z.string().trim().min(1, "Invoice ID is required."),
  corrections: z.object({
    clientId: z.string().trim().min(1, "Client ID is required.").optional(),
    dates: z
      .object({
        dueDate: nullableDateSchema.optional(),
        issueDate: nullableDateSchema.optional(),
      })
        .strict()
        .optional(),
    paymentInstructions: z
      .string()
      .trim()
      .max(2000, "Payment instructions must be 2000 characters or fewer.")
      .optional(),
    sections: z.array(invoiceSectionCorrectionSchema).optional(),
    status: z.enum(["draft", "sent"]).optional(),
    terms: z.string().trim().max(2000, "Terms must be 2000 characters or fewer.").optional(),
  }).strict(),
}).strict();

type CorrectInvoiceDataInput = z.input<typeof correctInvoiceDataSchema>;
type CorrectInvoiceDataData = z.output<typeof correctInvoiceDataSchema>;
type InvoiceSectionCorrection = NonNullable<CorrectInvoiceDataData["corrections"]["sections"]>[number];
type InvoiceLineItemCorrection = NonNullable<InvoiceSectionCorrection["lineItems"]>[number];

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

function getFieldErrors(error: z.ZodError<CorrectInvoiceDataInput>) {
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
  lineItem: InvoiceLineItemRecord,
  correction: InvoiceLineItemCorrection,
): InvoiceLineItemRecord {
  const quantity = correction.quantity ?? lineItem.quantity;
  const unitPriceCents = correction.unitPriceCents ?? lineItem.unitPriceCents;

  return {
    ...lineItem,
    content: correction.description ?? lineItem.content,
    lineTotalCents: quantity * unitPriceCents,
    name: correction.name ?? lineItem.name,
    quantity,
    unitLabel: correction.unitLabel ?? lineItem.unitLabel,
    unitPriceCents,
  };
}

function normalizeSections(sections: InvoiceSectionRecord[]): InvoiceSectionRecord[] {
  return sections.map((section, sectionIndex) => ({
    ...section,
    position: sectionIndex,
    lineItems: section.lineItems.map((lineItem, lineItemIndex) => ({
      ...lineItem,
      lineTotalCents: lineItem.quantity * lineItem.unitPriceCents,
      position: lineItemIndex,
    })),
  }));
}

function applySectionCorrections(
  invoice: InvoiceDetailRecord,
  corrections: CorrectInvoiceDataData["corrections"],
) {
  const fieldErrors: Record<string, string[]> = {};

  if (!corrections.sections || corrections.sections.length === 0) {
    return { fieldErrors, sections: invoice.sections };
  }

  const sectionCorrections = new Map(
    corrections.sections.map((section, sectionIndex) => [section.id, { section, sectionIndex }]),
  );

  for (const [sectionId, { sectionIndex }] of sectionCorrections.entries()) {
    if (!invoice.sections.some((section) => section.id === sectionId)) {
      pushFieldError(fieldErrors, `corrections.sections.${sectionIndex}.id`, "Section not found.");
    }
  }

  const sections = normalizeSections(
    invoice.sections.map((section) => {
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

function revalidateInvoicePaths(invoiceId: string) {
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath(`/invoices/${invoiceId}/preview`);
  revalidatePath("/records/history");
}

export async function correctInvoiceData(
  input: CorrectInvoiceDataInput,
): Promise<ActionResult<{ invoice: InvoiceDetailRecord }>> {
  try {
    const session = await requireSession();
    const parsed = correctInvoiceDataSchema.safeParse(input);

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

    const fieldErrors: Record<string, string[]> = {};
    const { corrections } = parsed.data;

    if (corrections.clientId) {
      const client = await getClientByIdForStudio(invoice.studioId, corrections.clientId);

      if (!client) {
        pushFieldError(fieldErrors, "corrections.clientId", "Select a client from your studio.");
      }
    }

    if (invoice.status === "paid" && corrections.status) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Paid invoices cannot change status during correction.",
        },
      };
    }

    const sectionResult = applySectionCorrections(invoice, corrections);

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

    const updatedInvoice = await updateInvoice(invoice.id, invoice.studioId, {
      clientId: corrections.clientId ?? invoice.clientId,
      dueDate: corrections.dates?.dueDate ?? invoice.dueDate,
      issueDate: corrections.dates?.issueDate ?? invoice.issueDate,
      paymentInstructions:
        corrections.paymentInstructions ?? invoice.paymentInstructions,
      sections: sectionResult.sections.map((section) => ({
        id: section.id,
        title: section.title,
        content: section.content,
        position: section.position,
        lineItems: section.lineItems.map((lineItem) => ({
          id: lineItem.id,
          name: lineItem.name,
          content: lineItem.content,
          quantity: lineItem.quantity,
          unitLabel: lineItem.unitLabel,
          unitPriceCents: lineItem.unitPriceCents,
          position: lineItem.position,
        })),
      })),
      terms: corrections.terms ?? invoice.terms,
      title: invoice.title,
    });

    const nextStatus = corrections.status ?? invoice.status;

    const finalInvoice =
      nextStatus !== updatedInvoice.status
        ? await updateInvoiceStatus(invoice.id, nextStatus)
        : updatedInvoice;

    if (!finalInvoice) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Invoice was corrected but could not be reloaded.",
        },
      };
    }

    await emitCorrectionEvent({
      type: "invoice.corrected",
      recordId: invoice.id,
      studioId: invoice.studioId,
    });
    revalidateInvoicePaths(invoice.id);

    return {
      ok: true,
      data: { invoice: finalInvoice },
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
        message: "Could not correct invoice data.",
      },
    };
  }
}
