import { z } from "zod";

export const createQuoteSchema = z.object({
  clientId: z.string().trim().min(1, "Client is required."),
  title: z
    .string()
    .trim()
    .min(1, "Quote title is required.")
    .max(160, "Quote title must be 160 characters or fewer."),
  selectedServicePackageIds: z
    .array(z.string().trim().min(1, "Service package id is required."))
    .min(1, "Select at least one service package."),
  terms: z
    .string()
    .trim()
    .max(2000, "Terms must be 2000 characters or fewer.")
    .optional()
    .default(""),
});

export type CreateQuoteSchemaInput = z.infer<typeof createQuoteSchema>;

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

export function getCreateQuoteFieldErrors(
  error: z.ZodError<CreateQuoteSchemaInput>,
): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((fieldErrors, issue) => {
    const path = Array.from(issue.path).filter(
      (value): value is string | number =>
        typeof value === "string" || typeof value === "number",
    );

    if (path.length === 0) {
      pushFieldError(fieldErrors, "form", issue.message);
    } else if (
      path.length === 2 &&
      path[0] === "selectedServicePackageIds" &&
      typeof path[1] === "number"
    ) {
      pushFieldError(
        fieldErrors,
        `selectedServicePackageIds.${path[1]}`,
        issue.message,
      );
    } else {
      pushFieldError(fieldErrors, String(path[0]), issue.message);
    }

    return fieldErrors;
  }, {});
}
