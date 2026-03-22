import { z } from "zod";

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

const lineItemSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Line item name is required.")
    .max(160, "Line item name must be 160 characters or fewer."),
  content: z
    .string()
    .trim()
    .max(2000, "Line item content must be 2000 characters or fewer.")
    .optional()
    .default(""),
  quantity: z
    .number({ error: "Quantity must be a number." })
    .int("Quantity must be a whole number.")
    .positive("Quantity must be greater than zero."),
  unitLabel: z
    .string()
    .trim()
    .max(40, "Unit label must be 40 characters or fewer.")
    .optional()
    .default(""),
  unitPriceCents: z
    .number({ error: "Unit price must be a number." })
    .int("Unit price must be a whole number.")
    .min(0, "Unit price cannot be negative."),
  position: z
    .number({ error: "Position must be a number." })
    .int("Position must be a whole number.")
    .min(0, "Position cannot be negative."),
});

const sectionSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Section title is required.")
    .max(160, "Section title must be 160 characters or fewer."),
  content: z
    .string()
    .trim()
    .max(2000, "Section content must be 2000 characters or fewer.")
    .optional()
    .default(""),
  position: z
    .number({ error: "Position must be a number." })
    .int("Position must be a whole number.")
    .min(0, "Position cannot be negative."),
  lineItems: z
    .array(lineItemSchema)
    .optional()
    .default([]),
});

export const updateInvoiceSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required."),
  title: z
    .string()
    .trim()
    .min(1, "Invoice title is required.")
    .max(160, "Invoice title must be 160 characters or fewer.")
    .optional(),
  issueDate: nullableDateSchema,
  dueDate: nullableDateSchema,
  terms: z
    .string()
    .trim()
    .max(2000, "Terms must be 2000 characters or fewer.")
    .optional(),
  paymentInstructions: z
    .string()
    .trim()
    .max(2000, "Payment instructions must be 2000 characters or fewer.")
    .optional(),
  sections: z.array(sectionSchema).optional().default([]),
});

export type UpdateInvoiceInput = z.input<typeof updateInvoiceSchema>;
export type UpdateInvoiceData = z.output<typeof updateInvoiceSchema>;
export type SectionInput = z.input<typeof sectionSchema>;
export type LineItemInput = z.input<typeof lineItemSchema>;

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

export function getUpdateInvoiceFieldErrors(
  error: z.ZodError<UpdateInvoiceInput>,
) {
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
