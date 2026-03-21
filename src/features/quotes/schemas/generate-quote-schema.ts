import { z } from "zod";

export const generateQuoteSchema = z.object({
  quoteId: z.string().trim().min(1, "Quote ID is required."),
});

export type GenerateQuoteSchemaInput = z.infer<typeof generateQuoteSchema>;

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

export function getGenerateQuoteFieldErrors(
  error: z.ZodError<GenerateQuoteSchemaInput>,
): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((fieldErrors, issue) => {
    const path = Array.from(issue.path).filter(
      (value): value is string | number =>
        typeof value === "string" || typeof value === "number",
    );

    if (path.length === 0) {
      pushFieldError(fieldErrors, "form", issue.message);
    } else {
      pushFieldError(fieldErrors, String(path[0]), issue.message);
    }

    return fieldErrors;
  }, {});
}
