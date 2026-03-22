"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { reopenInvoiceAction } from "@/features/invoices/server/actions/reopen-invoice";

type ReopenInvoiceButtonProps = {
  invoiceId: string;
  onReopened?: () => void;
};

export function ReopenInvoiceButton({ invoiceId, onReopened }: ReopenInvoiceButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await reopenInvoiceAction({ invoiceId });

        if (result.ok) {
          onReopened?.();
          router.refresh();
          return;
        }

        setError(result.error.message);
      } catch {
        setError("The invoice could not be reopened. Please try again.");
      }
    });
  }, [invoiceId, onReopened, router]);

  return (
    <div className="space-y-3">
      <Button variant="outline" onClick={handleClick} disabled={isPending}>
        {isPending ? "Reopening..." : "Reopen for Editing"}
      </Button>
      {error ? <InlineAlert title="Could not reopen invoice" message={error} /> : null}
    </div>
  );
}
