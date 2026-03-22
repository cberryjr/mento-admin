"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { calculateInvoiceTotalCents } from "@/features/invoices/server/calculators/invoice-totals";
import type { InvoiceDetailRecord } from "@/features/invoices/types";

type ConversionReviewPanelProps = {
  invoice: InvoiceDetailRecord;
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ConversionReviewPanel({ invoice }: ConversionReviewPanelProps) {
  const totalCents = calculateInvoiceTotalCents(invoice.lineItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion review</CardTitle>
        <CardDescription>
          This invoice was generated from an accepted quote. Review the carried-over data below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          Quote content carries over into the invoice draft below. Non-draft invoices are read-only here so the saved record stays explicit.
        </div>

        {invoice.client ? (
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Client details
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">{invoice.client.name}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Contact</p>
                <p className="text-sm text-zinc-900">{invoice.client.contactName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</p>
                <p className="text-sm text-zinc-900">{invoice.client.contactEmail}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</p>
                <p className="text-sm text-zinc-900">{invoice.client.contactPhone}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Source quote</p>
            <p className="text-sm text-zinc-900">
              {invoice.sourceQuote
                ? `${invoice.sourceQuote.quoteNumber} — ${invoice.sourceQuote.title}`
                : "Unknown"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Invoice number</p>
            <p className="text-sm font-semibold text-zinc-900">{invoice.invoiceNumber}</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="conversion-review-title" className="text-sm font-medium text-zinc-900">
              Invoice title
            </label>
            <Input id="conversion-review-title" value={invoice.title} readOnly disabled />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Status</p>
            <p className="text-sm font-medium text-zinc-900">{invoice.status}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="conversion-review-issue-date" className="text-sm font-medium text-zinc-900">
                Issue date
              </label>
              <Input
                id="conversion-review-issue-date"
                type="date"
                value={invoice.issueDate?.slice(0, 10) ?? ""}
                readOnly
                disabled
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="conversion-review-due-date" className="text-sm font-medium text-zinc-900">
                Due date
              </label>
              <Input
                id="conversion-review-due-date"
                type="date"
                value={invoice.dueDate?.slice(0, 10) ?? ""}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="conversion-review-payment-instructions"
              className="text-sm font-medium text-zinc-900"
            >
              Payment instructions
            </label>
            <Textarea
              id="conversion-review-payment-instructions"
              value={invoice.paymentInstructions}
              rows={4}
              readOnly
              disabled
            />
          </div>

          <div className="space-y-1 lg:col-span-2">
            <label htmlFor="conversion-review-terms" className="text-sm font-medium text-zinc-900">
              Terms carried over from quote
            </label>
            <Textarea
              id="conversion-review-terms"
              value={invoice.terms}
              rows={4}
              readOnly
              disabled
            />
          </div>
        </div>

        {invoice.sections.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Quote content carried into invoice ({invoice.lineItems.length} items)
            </p>
            <div className="space-y-4">
              {invoice.sections.map((section, index) => (
                <div key={section.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="space-y-1 border-b border-zinc-200 pb-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Section {index + 1}
                    </p>
                    <p className="text-sm font-semibold text-zinc-900">{section.title}</p>
                    {section.content ? <p className="text-sm text-zinc-600">{section.content}</p> : null}
                  </div>

                  <div className="mt-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <p className="font-medium text-zinc-900">{item.name}</p>
                              {item.content ? <p className="text-xs text-zinc-500">{item.content}</p> : null}
                            </TableCell>
                            <TableCell className="text-right text-zinc-900">
                              {item.quantity} {item.unitLabel}
                            </TableCell>
                            <TableCell className="text-right text-zinc-900">
                              {formatCents(item.unitPriceCents)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-zinc-900">
                              {formatCents(item.lineTotalCents)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-zinc-200 pt-3">
              <p className="text-sm font-semibold text-zinc-900">Total {formatCents(totalCents)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No line items were carried over from the quote.</p>
        )}
      </CardContent>
    </Card>
  );
}
