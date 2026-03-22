"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { InlineAlert } from "@/components/feedback/inline-alert";
import { markQuoteAccepted } from "@/features/quotes/server/actions/mark-quote-accepted";

type MarkQuoteAcceptedButtonProps = {
  quoteId: string;
};

export function MarkQuoteAcceptedButton({ quoteId }: MarkQuoteAcceptedButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);

  function handleClick() {
    setError(null);

    startTransition(async () => {
      const result = await markQuoteAccepted({ quoteId });

      if (result.ok) {
        setIsAccepted(true);
        router.refresh();
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
        disabled={isPending || isAccepted}
        className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Marking..." : isAccepted ? "Marked as accepted" : "Mark as accepted"}
      </button>

      {isAccepted ? (
        <p
          role="status"
          className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900"
        >
          Quote marked as accepted. You can now convert this quote into an invoice.
        </p>
      ) : null}

      {error ? <InlineAlert title="Could not mark quote as accepted" message={error} /> : null}
    </div>
  );
}
