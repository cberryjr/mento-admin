"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { InlineAlert } from "@/components/feedback/inline-alert";
import { createInvoiceFromQuoteAction } from "@/features/invoices/server/actions/create-invoice-from-quote";

type ConvertToInvoiceButtonProps = {
  quoteId: string;
};

export function ConvertToInvoiceButton({ quoteId }: ConvertToInvoiceButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  function handleClick() {
    setError(null);

    startTransition(async () => {
      const result = await createInvoiceFromQuoteAction({ quoteId });

      if (result.ok) {
        setInvoiceId(result.data.invoice.id);
        router.refresh();
        router.push(`/invoices/${result.data.invoice.id}`);
        return;
      }

      setError(result.error.message);
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || invoiceId !== null}
        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? "Converting..."
          : invoiceId
            ? "Converted to invoice"
            : "Convert to invoice"}
      </button>

      {invoiceId ? (
        <p
          role="status"
          className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900"
        >
          Invoice created successfully. Redirecting to invoice detail...
        </p>
      ) : null}

      {error ? (
        <InlineAlert
          title="Could not convert to invoice"
          message={error}
        />
      ) : null}
    </div>
  );
}
