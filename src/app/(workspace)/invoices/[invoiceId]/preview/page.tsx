import Link from "next/link";
import { notFound } from "next/navigation";

import { InlineAlert } from "@/components/feedback/inline-alert";
import { InvoicePreview } from "@/features/invoices/components/invoice-preview";
import { getInvoice } from "@/features/invoices/server/queries/get-invoice";
import { getStudioDefaults } from "@/features/studio-defaults/server/queries/get-studio-defaults";

type InvoicePreviewPageProps = {
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

function buildInvoiceDetailHref(invoiceId: string, backTo: string): string {
  return `/invoices/${invoiceId}?backTo=${encodeURIComponent(backTo)}`;
}

function renderInvoicePreviewLoadFailure(message: string, detailHref: string) {
  return (
    <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Invoice preview</h2>
        </div>
        <Link
          href={detailHref}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Back to invoice
        </Link>
      </div>
      <InlineAlert title="Could not load invoice preview" message={message} />
      <p className="mt-1 text-sm text-zinc-600">
        Try reloading the page, or return to the invoice details view.
      </p>
    </section>
  );
}

export default async function InvoicePreviewPage({
  params,
  searchParams,
}: InvoicePreviewPageProps) {
  const { invoiceId } = await params;
  const { backTo } = await searchParams;
  const safeBackTo = sanitizeBackTo(backTo);
  const detailHref = buildInvoiceDetailHref(invoiceId, safeBackTo);

  const invoiceResult = await getInvoice(invoiceId);

  if (!invoiceResult.ok) {
    if (invoiceResult.error.message === "Invoice not found.") {
      notFound();
    }

    return renderInvoicePreviewLoadFailure(invoiceResult.error.message, detailHref);
  }

  const studioDefaultsResult = await getStudioDefaults();
  const studioName = studioDefaultsResult.ok
    ? studioDefaultsResult.data.studioDefaults?.studioName ?? null
    : null;

  return (
    <section className="space-y-6">
      <InvoicePreview
        invoice={invoiceResult.data.invoice}
        studioName={studioName}
        editorHref={detailHref}
      />
    </section>
  );
}
