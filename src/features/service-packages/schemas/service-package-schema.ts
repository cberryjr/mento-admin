import { z } from "zod";

import {
  COMPLEXITY_TIERS,
  DURATION_UNITS,
  RESOLUTION_OPTIONS,
  SERVICE_CATEGORY_PROFILES,
  URGENCY_OPTIONS,
} from "@/features/service-packages/catalog-contract";
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
  unitLabel: z.string().trim().max(40, "Unit label must be 40 characters or fewer."),
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

const servicePackageTimeGuidanceSchema = z
  .object({
    minValue: z.number().int().min(1, "Minimum time guidance must be at least 1."),
    maxValue: z.number().int().min(1, "Maximum time guidance must be at least 1."),
    unit: z.enum(DURATION_UNITS, {
      error: "Time guidance unit must be day or week.",
    }),
  })
  .superRefine((value, context) => {
    if (value.maxValue < value.minValue) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxValue"],
        message: "Maximum time guidance must be greater than or equal to minimum guidance.",
      });
    }
  });

const servicePackageVariableDefaultsSchema = z.object({
  quantity: z.number().int().min(1, "Quantity default must be at least 1."),
  durationValue: z
    .number()
    .int("Duration default must be a whole number.")
    .min(1, "Duration default must be at least 1.")
    .nullable(),
  durationUnit: z.enum(DURATION_UNITS).nullable(),
  resolution: z.enum(RESOLUTION_OPTIONS).nullable(),
  revisions: z.number().int().min(0, "Revision default cannot be negative."),
  urgency: z.enum(URGENCY_OPTIONS),
});

const servicePackageComplexityTierSchema = z
  .object({
    id: z.string().trim().min(1, "Tier id is required."),
    tier: z.enum(COMPLEXITY_TIERS, {
      error: "Tier must be standard, advanced, or premium.",
    }),
    title: z.string().trim().min(1, "Tier title is required."),
    descriptor: z.string().trim().min(1, "Tier descriptor is required."),
    deliverables: z
      .array(z.string().trim().min(1, "Deliverable text is required."))
      .min(1, "At least one deliverable is required."),
    processNotes: z
      .array(z.string().trim().min(1, "Process note text is required."))
      .min(1, "At least one process note is required."),
    timeGuidance: servicePackageTimeGuidanceSchema,
    variableDefaults: servicePackageVariableDefaultsSchema,
    position: z.number().int().min(1),
  })
  .superRefine((value, context) => {
    if ((value.variableDefaults.durationValue === null) !== (value.variableDefaults.durationUnit === null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variableDefaults", "durationValue"],
        message: "Duration value and duration unit must both be provided or both be null.",
      });
    }
  });

const categoryKeyValues = SERVICE_CATEGORY_PROFILES.map((profile) => profile.key) as [
  (typeof SERVICE_CATEGORY_PROFILES)[number]["key"],
  ...(typeof SERVICE_CATEGORY_PROFILES)[number]["key"][],
];

export const servicePackageSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Service package name is required.")
      .max(160, "Service package name must be 160 characters or fewer."),
    categoryKey: z.enum(categoryKeyValues),
    categoryLabel: z.string().trim().min(1, "Category label is required."),
    categoryShortLabel: z.string().trim().min(1, "Category short label is required."),
    category: z.string().trim().min(1, "Category is required."),
    shortDescription: z
      .string()
      .trim()
      .max(120, "Short summary must be 120 characters or fewer."),
    complexityTiers: z
      .array(servicePackageComplexityTierSchema)
      .length(3, "Complexity matrix must include Standard, Advanced, and Premium tiers."),
    sections: z.array(servicePackageSectionSchema).min(1, "Add at least one section."),
  })
  .superRefine((value, context) => {
    const seen = new Set<string>();

    value.complexityTiers.forEach((tier, index) => {
      if (seen.has(tier.tier)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["complexityTiers", index, "tier"],
          message: "Each complexity tier must be unique.",
        });
      }
      seen.add(tier.tier);
    });

    COMPLEXITY_TIERS.forEach((requiredTier) => {
      if (!seen.has(requiredTier)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["complexityTiers"],
          message: "Complexity matrix must contain standard, advanced, and premium tiers.",
        });
      }
    });
  });

export type ServicePackageSchemaInput = z.infer<typeof servicePackageSchema>;

function pushFieldError(fieldErrors: Record<string, string[]>, key: string, message: string) {
  if (!fieldErrors[key]) {
    fieldErrors[key] = [];
  }

  fieldErrors[key].push(message);
}

function getIssueKey(input: ServicePackageInput, path: Array<string | number>): string {
  const [root, firstIndex, nestedRoot, secondIndex, field, sixth] = path;

  if (typeof root !== "string") {
    return "form";
  }

  if (root === "sections") {
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

  if (root === "complexityTiers") {
    if (typeof firstIndex !== "number") {
      return "complexityTiers";
    }

    const tier = input.complexityTiers[firstIndex];

    if (!tier) {
      return "complexityTiers";
    }

    if (
      (nestedRoot === "deliverables" || nestedRoot === "processNotes") &&
      typeof secondIndex === "number"
    ) {
      return `complexityTiersById.${tier.id}.${nestedRoot}.${secondIndex}`;
    }

    if (nestedRoot === "deliverables" || nestedRoot === "processNotes") {
      return `complexityTiersById.${tier.id}.${nestedRoot}`;
    }

    if (nestedRoot === "timeGuidance") {
      return `complexityTiersById.${tier.id}.timeGuidance.${String(field ?? "value")}`;
    }

    if (nestedRoot === "variableDefaults") {
      return `complexityTiersById.${tier.id}.variableDefaults.${String(field ?? "value")}`;
    }

    if (
      nestedRoot === "variableDefaults" &&
      field === "durationValue" &&
      sixth === undefined
    ) {
      return `complexityTiersById.${tier.id}.variableDefaults.durationValue`;
    }

    const tierField = typeof nestedRoot === "string" ? nestedRoot : "tier";
    return `complexityTiersById.${tier.id}.${tierField}`;
  }

  return root;
}

export function getServicePackageFieldErrors(
  input: ServicePackageInput,
  error: z.ZodError<ServicePackageSchemaInput>,
): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((fieldErrors, issue) => {
    const key = getIssueKey(
      input,
      Array.from(issue.path).filter((value) => typeof value !== "symbol"),
    );
    pushFieldError(fieldErrors, key, issue.message);
    return fieldErrors;
  }, {});
}
