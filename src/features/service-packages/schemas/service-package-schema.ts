import { z } from "zod";

import type { ServicePackageInput } from "@/features/service-packages/types";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function toServicePackageInput(formData: FormData): ServicePackageInput {
  return {
    name: getFormValue(formData, "name"),
    category: getFormValue(formData, "category"),
    startingPriceLabel: getFormValue(formData, "startingPriceLabel"),
    shortDescription: getFormValue(formData, "shortDescription"),
  };
}

export const servicePackageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Service package name is required.")
    .max(160, "Service package name must be 160 characters or fewer."),
  category: z
    .string()
    .trim()
    .min(1, "Category is required.")
    .max(80, "Category must be 80 characters or fewer."),
  startingPriceLabel: z
    .string()
    .trim()
    .min(1, "Starting price guidance is required.")
    .max(60, "Starting price guidance must be 60 characters or fewer."),
  shortDescription: z
    .string()
    .trim()
    .max(120, "Short summary must be 120 characters or fewer."),
});

export type ServicePackageSchemaInput = z.infer<typeof servicePackageSchema>;
