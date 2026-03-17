import { z } from "zod";

import type { ClientInput } from "@/features/clients/types";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function toClientInput(formData: FormData): ClientInput {
  return {
    name: getFormValue(formData, "name"),
    contactName: getFormValue(formData, "contactName"),
    contactEmail: getFormValue(formData, "contactEmail"),
    contactPhone: getFormValue(formData, "contactPhone"),
  };
}

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Client name is required.")
    .max(160, "Client name must be 160 characters or fewer."),
  contactName: z
    .string()
    .trim()
    .max(120, "Contact name must be 120 characters or fewer."),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Contact email must be a valid email address.")
    .or(z.literal("")),
  contactPhone: z
    .string()
    .trim()
    .max(40, "Contact phone must be 40 characters or fewer."),
});

export type ClientSchemaInput = z.infer<typeof clientSchema>;
