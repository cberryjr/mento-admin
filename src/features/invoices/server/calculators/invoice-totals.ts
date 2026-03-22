import type { InvoiceLineItemRecord } from "@/features/invoices/types";

export function calculateInvoiceTotalCents(
  lineItems: InvoiceLineItemRecord[],
): number {
  return lineItems.reduce((total, lineItem) => {
    return total + lineItem.lineTotalCents;
  }, 0);
}
