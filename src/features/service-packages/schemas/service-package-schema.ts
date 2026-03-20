import { z } from "zod";

import type { ServicePackageInput } from "@/features/service-packages/types";

const servicePackageLineItemSchema = z.object({
  id: z.string().trim().min(1, "Line item id is required."),
  sectionId: z.string().trim().min(1, "Line item section id is required."),
  name: z
    .string()
    .trim()
    .min(1, "Line item name is required.")
    .max(160, "Line item name must be 160 characters or fewer."),
  defaultContent: z
    .string()
    .trim()
    .max(2000, "Line item default content must be 2000 characters or fewer."),
  quantity: z
    .number({ message: "Quantity must be a number." })
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(10000, "Quantity must be 10,000 or fewer."),
  unitLabel: z
    .string()
    .trim()
    .max(40, "Unit label must be 40 characters or fewer."),
  unitPriceCents: z
    .number({ message: "Unit price must be a number." })
    .int("Unit price must be stored in whole cents.")
    .min(0, "Unit price must be zero or greater.")
    .max(100_000_000, "Unit price must be $1,000,000 or less."),
  position: z
    .number({ message: "Line item position must be a number." })
    .int("Line item position must be a whole number.")
    .min(1, "Line item position must be at least 1."),
});

const servicePackageSectionSchema = z.object({
  id: z.string().trim().min(1, "Section id is required."),
  title: z
    .string()
    .trim()
    .min(1, "Section title is required.")
    .max(120, "Section title must be 120 characters or fewer."),
  defaultContent: z
    .string()
    .trim()
    .max(2000, "Section default content must be 2000 characters or fewer."),
  position: z
    .number({ message: "Section position must be a number." })
    .int("Section position must be a whole number.")
    .min(1, "Section position must be at least 1."),
  lineItems: z
    .array(servicePackageLineItemSchema)
    .min(1, "Each section must contain at least one line item."),
});

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
  shortDescription: z
    .string()
    .trim()
    .max(120, "Short summary must be 120 characters or fewer."),
  sections: z.array(servicePackageSectionSchema).min(1, "Add at least one section."),
});

export type ServicePackageSchemaInput = z.infer<typeof servicePackageSchema>;

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

function getIssueKey(
  input: ServicePackageInput,
  path: Array<string | number>,
): string {
  const [root, firstIndex, nestedRoot, secondIndex, field] = path;

  if (typeof root !== "string") {
    return "form";
  }

  if (root !== "sections") {
    return root;
  }

  if (typeof firstIndex !== "number") {
    return "sections";
  }

  const section = input.sections[firstIndex];

  if (!section) {
    return "sections";
  }

  if (nestedRoot !== "lineItems") {
    const sectionField = typeof nestedRoot === "string" ? nestedRoot : "section";
    return `sectionsById.${section.id}.${sectionField}`;
  }

  if (typeof secondIndex !== "number") {
    return `sectionsById.${section.id}.lineItems`;
  }

  const lineItem = section.lineItems[secondIndex];

  if (!lineItem) {
    return `sectionsById.${section.id}.lineItems`;
  }

  const lineItemField = typeof field === "string" ? field : "lineItems";
  return `lineItemsById.${lineItem.id}.${lineItemField}`;
}

export function getServicePackageFieldErrors(
  input: ServicePackageInput,
  error: z.ZodError<ServicePackageSchemaInput>,
): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((fieldErrors, issue) => {
    const key = getIssueKey(input, Array.from(issue.path).filter((value) => typeof value !== "symbol"));
    pushFieldError(fieldErrors, key, issue.message);
    return fieldErrors;
  }, {});
}
