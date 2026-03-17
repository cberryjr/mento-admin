import { z } from "zod";

import type { StudioDefaultsInput } from "@/features/studio-defaults/types";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function toStudioDefaultsInput(formData: FormData): StudioDefaultsInput {
  return {
    studioName: getFormValue(formData, "studioName"),
    studioContactName: getFormValue(formData, "studioContactName"),
    studioContactEmail: getFormValue(formData, "studioContactEmail").toLowerCase(),
    studioContactPhone: getFormValue(formData, "studioContactPhone"),
    defaultQuoteTerms: getFormValue(formData, "defaultQuoteTerms"),
    defaultInvoicePaymentInstructions: getFormValue(
      formData,
      "defaultInvoicePaymentInstructions",
    ),
  };
}

export const studioDefaultsSchema = z.object({
  studioName: z
    .string()
    .min(1, "Studio name is required.")
    .max(120, "Studio name must be 120 characters or fewer."),
  studioContactName: z
    .string()
    .max(120, "Studio contact name must be 120 characters or fewer."),
  studioContactEmail: z
    .string()
    .email("Studio contact email must be a valid email address.")
    .or(z.literal("")),
  studioContactPhone: z
    .string()
    .max(40, "Studio contact phone must be 40 characters or fewer."),
  defaultQuoteTerms: z
    .string()
    .min(1, "Default quote terms are required.")
    .max(5000, "Default quote terms must be 5000 characters or fewer."),
  defaultInvoicePaymentInstructions: z
    .string()
    .min(1, "Default invoice payment instructions are required.")
    .max(
      5000,
      "Default invoice payment instructions must be 5000 characters or fewer.",
    ),
});

export type StudioDefaultsSchemaInput = z.infer<typeof studioDefaultsSchema>;
