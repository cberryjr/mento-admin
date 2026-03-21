import { z } from "zod";

export const updateQuoteLineItemSchema = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1, "Line item name is required."),
  content: z.string().trim().default(""),
  quantity: z.number().int().min(1, "Quantity must be at least 1."),
  unitLabel: z.string().trim().default(""),
  unitPriceCents: z.number().int().min(0, "Unit price must be zero or positive."),
  position: z.number().int().min(1, "Position must be at least 1."),
});

export const updateQuoteSectionSchema = z.object({
  id: z.string().trim().min(1).optional(),
  sourceServicePackageId: z.string().trim().optional(),
  title: z.string().trim().min(1, "Section title is required."),
  content: z.string().trim().default(""),
  position: z.number().int().min(1, "Position must be at least 1."),
  lineItems: z.array(updateQuoteLineItemSchema).default([]),
});

export const updateQuoteSectionsSchema = z.object({
  quoteId: z.string().trim().min(1, "Quote ID is required."),
  sections: z.array(updateQuoteSectionSchema).default([]),
});

export type UpdateQuoteSectionsSchemaInput = z.infer<
  typeof updateQuoteSectionsSchema
>;

export type UpdateQuoteSectionSchemaInput = z.infer<
  typeof updateQuoteSectionSchema
>;

export type UpdateQuoteLineItemSchemaInput = z.infer<
  typeof updateQuoteLineItemSchema
>;

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

export function getUpdateQuoteSectionsFieldErrors(
  error: z.ZodError<UpdateQuoteSectionsSchemaInput>,
): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((fieldErrors, issue) => {
    const path = Array.from(issue.path).filter(
      (value): value is string | number =>
        typeof value === "string" || typeof value === "number",
    );

    if (path.length === 0) {
      pushFieldError(fieldErrors, "form", issue.message);
    } else {
      const key = path.map(String).join(".");
      pushFieldError(fieldErrors, key, issue.message);
    }

    return fieldErrors;
  }, {});
}

export const addQuoteSectionSchema = z.object({
  quoteId: z.string().trim().min(1, "Quote ID is required."),
});

export type AddQuoteSectionSchemaInput = z.infer<
  typeof addQuoteSectionSchema
>;

export const removeQuoteSectionSchema = z.object({
  quoteId: z.string().trim().min(1, "Quote ID is required."),
  sectionId: z.string().trim().min(1, "Section ID is required."),
});

export type RemoveQuoteSectionSchemaInput = z.infer<
  typeof removeQuoteSectionSchema
>;

export const addQuoteLineItemSchema = z.object({
  quoteId: z.string().trim().min(1, "Quote ID is required."),
  sectionId: z.string().trim().min(1, "Section ID is required."),
});

export type AddQuoteLineItemSchemaInput = z.infer<
  typeof addQuoteLineItemSchema
>;

export const removeQuoteLineItemSchema = z.object({
  quoteId: z.string().trim().min(1, "Quote ID is required."),
  sectionId: z.string().trim().min(1, "Section ID is required."),
  lineItemId: z.string().trim().min(1, "Line item ID is required."),
});

export type RemoveQuoteLineItemSchemaInput = z.infer<
  typeof removeQuoteLineItemSchema
>;

const uuidSchema = z.string().uuid("ID must be a valid UUID.");

const uuidArraySchema = z
  .array(uuidSchema)
  .min(1, "At least one item is required.");

function hasDuplicates(ids: string[]): boolean {
  return new Set(ids).size !== ids.length;
}

export const reorderQuoteSectionsSchema = z
  .object({
    quoteId: uuidSchema,
    sectionIds: uuidArraySchema,
  })
  .refine((data) => !hasDuplicates(data.sectionIds), {
    message: "Duplicate section IDs are not allowed.",
    path: ["sectionIds"],
  });

export type ReorderQuoteSectionsSchemaInput = z.infer<
  typeof reorderQuoteSectionsSchema
>;

export const reorderQuoteLineItemsSchema = z
  .object({
    quoteId: uuidSchema,
    sectionId: uuidSchema,
    lineItemIds: uuidArraySchema,
  })
  .refine((data) => !hasDuplicates(data.lineItemIds), {
    message: "Duplicate line item IDs are not allowed.",
    path: ["lineItemIds"],
  });

export type ReorderQuoteLineItemsSchemaInput = z.infer<
  typeof reorderQuoteLineItemsSchema
>;
