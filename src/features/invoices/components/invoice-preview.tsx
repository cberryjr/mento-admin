import Link from "next/link";

import type { InvoiceDetailRecord } from "@/features/invoices/types";
import { formatCurrencyFromCents } from "@/lib/format/currency";
import { formatInvoiceDate, calculateInvoiceGrandTotalCents } from "@/lib/format/invoice";

type InvoicePreviewProps = {
  invoice: InvoiceDetailRecord;
  studioName?: string | null;
  editorHref: string;
};

export function InvoicePreview({
  invoice,
  studioName,
  editorHref,
}: InvoicePreviewProps) {
  const grandTotalCents = calculateInvoiceGrandTotalCents(invoice);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={editorHref}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Back to invoice
        </Link>
      </div>

      <article className="rounded-xl border border-zinc-200 bg-white">
        <div className="space-y-8 p-8">
          <header className="flex items-start justify-between border-b border-zinc-200 pb-6">
            <div>
              {studioName ? <p className="text-sm font-medium text-zinc-500">{studioName}</p> : null}
              <h1 className="mt-1 text-2xl font-bold text-zinc-900">INVOICE</h1>
            </div>

            <div className="space-y-1 text-right text-sm text-zinc-500">
              <p className="font-semibold text-zinc-900">{invoice.invoiceNumber}</p>
              <p>Status: {invoice.status}</p>
              <p>Issue date: {formatInvoiceDate(invoice.issueDate)}</p>
              <p>Due date: {formatInvoiceDate(invoice.dueDate)}</p>
            </div>
          </header>

          <section aria-label="Client details" className="space-y-1">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Bill to</h3>
            <p className="text-sm font-semibold text-zinc-900">
              {invoice.client?.name ?? "Unknown client"}
            </p>
            {invoice.client?.contactName ? (
              <p className="text-sm text-zinc-600">{invoice.client.contactName}</p>
            ) : null}
            {invoice.client?.contactEmail ? (
              <p className="text-sm text-zinc-600">{invoice.client.contactEmail}</p>
            ) : null}
            {invoice.client?.contactPhone ? (
              <p className="text-sm text-zinc-600">{invoice.client.contactPhone}</p>
            ) : null}
          </section>

          {invoice.sections.map((section) => (
            <section
              key={section.id}
              aria-label={section.title || "Invoice section"}
              className="space-y-3"
            >
              <h3 className="text-sm font-semibold text-zinc-900">
                {section.title || "Untitled section"}
              </h3>

              {section.content ? <p className="text-sm text-zinc-600">{section.content}</p> : null}

              {section.lineItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                        <th className="pb-2 pr-4">Item</th>
                        <th className="pb-2 pr-4">Description</th>
                        <th className="pb-2 pr-4 text-right">Qty</th>
                        <th className="pb-2 pr-4">Unit</th>
                        <th className="pb-2 pr-4 text-right">Unit Price</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.lineItems.map((item) => (
                        <tr key={item.id} className="border-b border-zinc-100">
                          <td className="py-2 pr-4 font-medium text-zinc-900">{item.name}</td>
                          <td className="py-2 pr-4 text-zinc-600">{item.content || "--"}</td>
                          <td className="py-2 pr-4 text-right text-zinc-900">{item.quantity}</td>
                          <td className="py-2 pr-4 text-zinc-600">{item.unitLabel || "--"}</td>
                          <td className="py-2 pr-4 text-right text-zinc-900">
                            {formatCurrencyFromCents(item.unitPriceCents)}
                          </td>
                          <td className="py-2 text-right font-medium text-zinc-900">
                            {formatCurrencyFromCents(item.lineTotalCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ))}

          <section
            aria-label="Invoice total"
            className="flex items-center justify-between border-t border-zinc-200 pt-6"
          >
            <p className="text-sm font-medium text-zinc-500">Total</p>
            <p className="text-xl font-bold text-zinc-900">
              {formatCurrencyFromCents(grandTotalCents)}
            </p>
          </section>

          <section aria-label="Payment instructions" className="border-t border-zinc-200 pt-6">
            <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Payment instructions
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">
              {invoice.paymentInstructions || "No payment instructions provided."}
            </p>
          </section>

          {invoice.terms ? (
            <section aria-label="Terms and conditions" className="border-t border-zinc-200 pt-6">
              <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Terms</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{invoice.terms}</p>
            </section>
          ) : null}
        </div>
      </article>
    </div>
  );
}
