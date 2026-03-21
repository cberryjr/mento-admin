"use client";

import { useState, useTransition } from "react";

import { generateQuoteContent } from "@/features/quotes/server/actions/generate-quote-content";

type GenerateQuoteButtonProps = {
  quoteId: string;
};

export function GenerateQuoteButton({ quoteId }: GenerateQuoteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  function handleGenerate() {
    setError(null);

    startTransition(async () => {
      const result = await generateQuoteContent({ quoteId });

      if (result.ok) {
        setSucceeded(true);
      } else {
        setError(result.error.message);
      }
    });
  }

  if (succeeded) {
    return (
      <div
        role="status"
        className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900"
      >
        <p className="font-semibold">Quote content generated</p>
        <p className="mt-1">
          The quote structure has been generated from the selected service
          packages. You can now review and edit the content below.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Generating..." : "Generate quote content"}
      </button>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          <p className="font-semibold">Generation failed</p>
          <p className="mt-1">{error}</p>
        </div>
      ) : null}
    </div>
  );
}
