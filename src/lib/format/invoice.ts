import type { InvoiceDetailRecord } from "@/features/invoices/types";

export function formatInvoiceDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function calculateInvoiceGrandTotalCents(invoice: InvoiceDetailRecord): number {
  return invoice.sections.reduce(
    (total, section) =>
      total + section.lineItems.reduce((sectionTotal, item) => sectionTotal + item.lineTotalCents, 0),
    0,
  );
}
