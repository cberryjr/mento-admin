import { notFound } from "next/navigation";

import { requireSession } from "@/features/auth/require-session";
import { CorrectionForm } from "@/features/corrections/components/correction-form";
import { getInvoice } from "@/features/invoices/server/queries/get-invoice";
import { correctInvoiceData } from "@/features/invoices/server/actions/correct-invoice-data";
import {
  buildInvoiceDetailHref,
  sanitizeInvoiceBackTo,
} from "@/features/invoices/lib/navigation";
import { getQuoteById } from "@/features/quotes/server/queries/get-quote-by-id";
import { correctQuoteData } from "@/features/quotes/server/actions/correct-quote-data";
import {
  buildQuoteDetailHref,
  sanitizeQuoteBackTo,
} from "@/features/quotes/lib/navigation";
import { listClientsForStudio } from "@/features/clients/server/clients-repository";

type CorrectionPageProps = {
  searchParams: Promise<{
    type?: string;
    id?: string;
    backTo?: string;
  }>;
};

function sanitizeCorrectionBackTo(backTo?: string): string | null {
  if (!backTo || !backTo.startsWith("/") || backTo.startsWith("//")) {
    return null;
  }

  return backTo;
}

export default async function CorrectionPage({ searchParams }: CorrectionPageProps) {
  const session = await requireSession();
  const { backTo, id, type } = await searchParams;

  if (!id || (type !== "quote" && type !== "invoice")) {
    notFound();
  }

  const clientOptions = (await listClientsForStudio(session.user.studioId)).map((client) => ({
    id: client.id,
    name: client.name,
  }));

  if (type === "quote") {
    const result = await getQuoteById(id);

    if (!result.ok) {
      notFound();
    }

    const safeBackHref =
      sanitizeCorrectionBackTo(backTo) ??
      buildQuoteDetailHref(result.data.quote.id, sanitizeQuoteBackTo(undefined));

    return (
      <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
        <CorrectionForm
          mode="quote"
          record={result.data.quote}
          clientOptions={clientOptions}
          backHref={safeBackHref}
          submitAction={correctQuoteData}
        />
      </section>
    );
  }

  const result = await getInvoice(id);

  if (!result.ok) {
    notFound();
  }

  const safeBackHref =
    sanitizeCorrectionBackTo(backTo) ??
    buildInvoiceDetailHref(result.data.invoice.id, sanitizeInvoiceBackTo(undefined));

  return (
    <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
      <CorrectionForm
        mode="invoice"
        record={result.data.invoice}
        clientOptions={clientOptions}
        backHref={safeBackHref}
        submitAction={correctInvoiceData}
      />
    </section>
  );
}
