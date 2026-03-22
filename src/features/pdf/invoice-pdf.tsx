import type { InvoiceDetailRecord } from "@/features/invoices/types";
import { formatCurrencyFromCents } from "@/lib/format/currency";
import { formatInvoiceDate, calculateInvoiceGrandTotalCents } from "@/lib/format/invoice";

import type { PdfDocument } from "@/server/pdf/render-pdf";

type BuildInvoicePdfOptions = {
  invoice: InvoiceDetailRecord;
  studioName?: string | null;
};

export function buildInvoicePdf({ invoice, studioName }: BuildInvoicePdfOptions): PdfDocument {
  const lines: string[] = [];

  if (studioName) {
    lines.push(studioName);
    lines.push("");
  }

  lines.push("INVOICE");
  lines.push(`Invoice number: ${invoice.invoiceNumber}`);
  lines.push(`Issue date: ${formatInvoiceDate(invoice.issueDate)}`);
  lines.push(`Due date: ${formatInvoiceDate(invoice.dueDate)}`);
  lines.push(`Status: ${invoice.status}`);
  lines.push("");
  lines.push("Bill to");
  lines.push(invoice.client?.name ?? "Unknown client");

  if (invoice.client?.contactName) {
    lines.push(invoice.client.contactName);
  }

  if (invoice.client?.contactEmail) {
    lines.push(invoice.client.contactEmail);
  }

  if (invoice.client?.contactPhone) {
    lines.push(invoice.client.contactPhone);
  }

  lines.push("");

  for (const section of invoice.sections) {
    lines.push(section.title || "Untitled section");

    if (section.content) {
      lines.push(section.content);
    }

    if (section.lineItems.length > 0) {
      lines.push("Item | Description | Qty | Unit | Unit Price | Line Total");

      for (const item of section.lineItems) {
        lines.push(
          [
            item.name,
            item.content || "--",
            String(item.quantity),
            item.unitLabel || "--",
            formatCurrencyFromCents(item.unitPriceCents),
            formatCurrencyFromCents(item.lineTotalCents),
          ].join(" | "),
        );
      }
    }

    lines.push("");
  }

  lines.push(`Total: ${formatCurrencyFromCents(calculateInvoiceGrandTotalCents(invoice))}`);
  lines.push("");
  lines.push("Payment instructions");
  lines.push(invoice.paymentInstructions || "No payment instructions provided.");

  if (invoice.terms) {
    lines.push("");
    lines.push("Terms");
    lines.push(invoice.terms);
  }

  return {
    title: invoice.invoiceNumber,
    lines,
  };
}
