import Link from "next/link";
import { notFound } from "next/navigation";

import { getInvoice } from "@/features/invoices/server/queries/get-invoice";
import { ConversionReviewPanel } from "@/features/invoices/components/conversion-review-panel";
import { InvoiceForm } from "@/features/invoices/components/invoice-form";
import { updateInvoiceAction } from "@/features/invoices/server/actions/update-invoice";
import { InlineAlert } from "@/components/feedback/inline-alert";

type InvoiceDetailPageProps = {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{ backTo?: string }>;
};

function sanitizeBackTo(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/invoices";
  }

  try {
    const parsedBackTo = new URL(value, "https://mento-admin.local");

    if (parsedBackTo.pathname !== "/invoices") {
      return "/invoices";
    }

    const search = parsedBackTo.searchParams.get("search");
    if (!search) {
      return "/invoices";
    }

    return `/invoices?search=${encodeURIComponent(search)}`;
  } catch {
    return "/invoices";
  }
}

function renderInvoiceLoadFailure(message: string, backTo: string) {
  return (
    <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Invoice details</h2>
        </div>
        <Link
          href={backTo}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Back to invoices
        </Link>
      </div>
      <InlineAlert title="Could not load invoice" message={message} />
      <p className="mt-1 text-sm text-zinc-600">
        Try reloading the page, or return to the invoices list.
      </p>
    </section>
  );
}

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: InvoiceDetailPageProps) {
  const { invoiceId } = await params;
  const { backTo } = await searchParams;
  const safeBackTo = sanitizeBackTo(backTo);

  const result = await getInvoice(invoiceId);

  if (!result.ok) {
    if (result.error.message === "Invoice not found.") {
      notFound();
    }

    return renderInvoiceLoadFailure(result.error.message, safeBackTo);
  }

  const { invoice } = result.data;

  return (
    <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">
            {invoice.status === "draft" ? "Edit invoice" : "Invoice details"}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            {invoice.status === "draft"
              ? "Update invoice fields, sections, and line items below."
              : "Review the carried-over commercial data, client details, and linked quote."}
          </p>
        </div>
        <Link
          href={safeBackTo}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Back
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Invoice number
          </p>
          <p className="text-sm font-semibold text-zinc-900">
            {invoice.invoiceNumber}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Status
          </p>
          <p className="text-sm font-medium text-zinc-900">{invoice.status}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Client
          </p>
          <p className="text-sm text-zinc-900">
            {invoice.client ? invoice.client.name : "Unknown"}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Source quote
          </p>
          <p className="text-sm text-zinc-900">
            {invoice.sourceQuote
              ? `${invoice.sourceQuote.quoteNumber} — ${invoice.sourceQuote.title}`
              : "Unknown"}
          </p>
        </div>
      </div>

      {invoice.status === "draft" ? (
        <InvoiceForm invoice={invoice} submitAction={updateInvoiceAction} />
      ) : (
        <ConversionReviewPanel invoice={invoice} />
      )}
    </section>
  );
}
