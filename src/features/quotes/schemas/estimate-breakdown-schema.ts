import { z } from "zod";

export const roleBreakdownEntrySchema = z.object({
  role: z.string().min(1, "Role is required."),
  hours: z.number().min(0, "Hours must be zero or positive."),
  hourlyRateCents: z.number().int().min(0, "Hourly rate must be zero or positive."),
  costCents: z.number().int().min(0, "Cost must be zero or positive."),
});

export const estimateBreakdownSchema = z.object({
  estimatedHours: z.object({
    min: z.number().min(0, "Min hours must be zero or positive."),
    max: z.number().min(0, "Max hours must be zero or positive."),
  }),
  roleBreakdown: z.array(roleBreakdownEntrySchema).default([]),
  internalCostCents: z.number().int().min(0, "Internal cost must be zero or positive."),
  marginPercent: z.number().min(0, "Margin percent must be zero or positive."),
  marginCents: z.number().int().min(0, "Margin must be zero or positive."),
  finalPriceCents: z.number().int().min(0, "Final price must be zero or positive."),
  deliverables: z.array(z.string()).default([]),
});

export const estimateBreakdownSourceSchema = z.object({
  servicePackageId: z.string().min(1, "Service package ID is required."),
  servicePackageName: z.string().min(1, "Service package name is required."),
  categoryLabel: z.string().min(1, "Category label is required."),
  tierKey: z.string().min(1, "Tier key is required."),
  tierTitle: z.string().min(1, "Tier title is required."),
  tierDescriptor: z.string(),
  timeGuidance: z.object({
    minValue: z.number().min(0, "Min time value must be zero or positive."),
    maxValue: z.number().min(0, "Max time value must be zero or positive."),
    unit: z.string().min(1, "Time unit is required."),
  }),
  variableDefaults: z.object({
    quantity: z.number().min(0, "Quantity must be zero or positive."),
    durationValue: z.number().nullable(),
    durationUnit: z.string().nullable(),
    resolution: z.string().nullable(),
    revisions: z.number().min(0, "Revisions must be zero or positive."),
    urgency: z.string().min(1, "Urgency is required."),
  }),
});

export const sectionEstimateBreakdownSchema = z.object({
  sectionId: z.string().min(1, "Section ID is required."),
  sectionTitle: z.string().min(1, "Section title is required."),
  source: estimateBreakdownSourceSchema,
  breakdown: estimateBreakdownSchema,
});

export const estimateBreakdownPayloadSchema = z.object({
  quoteId: z.string().min(1, "Quote ID is required."),
  computedAt: z.string().min(1, "Computed-at timestamp is required."),
  sectionBreakdowns: z.array(sectionEstimateBreakdownSchema).default([]),
  grandTotal: estimateBreakdownSchema,
});

export type RoleBreakdownEntryInput = z.infer<typeof roleBreakdownEntrySchema>;
export type EstimateBreakdownInput = z.infer<typeof estimateBreakdownSchema>;
export type EstimateBreakdownSourceInput = z.infer<typeof estimateBreakdownSourceSchema>;
export type SectionEstimateBreakdownInput = z.infer<typeof sectionEstimateBreakdownSchema>;
export type EstimateBreakdownPayloadInput = z.infer<typeof estimateBreakdownPayloadSchema>;
