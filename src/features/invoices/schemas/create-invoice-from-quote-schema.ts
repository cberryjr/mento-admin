import { z } from "zod";

export const createInvoiceFromQuoteSchema = z.object({
  quoteId: z.string().min(1, "Quote ID is required."),
});

export type CreateInvoiceFromQuoteInput = z.input<
  typeof createInvoiceFromQuoteSchema
>;
