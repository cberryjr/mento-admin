"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { generateQuoteContent } from "@/features/quotes/server/actions/generate-quote-content";

type GenerateQuoteButtonProps = {
  quoteId: string;
};

export function GenerateQuoteButton({ quoteId }: GenerateQuoteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);

    startTransition(async () => {
      const result = await generateQuoteContent({ quoteId });

      if (result.ok) {
        setIsRefreshing(true);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending || isRefreshing}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRefreshing
          ? "Refreshing quote..."
          : isPending
            ? "Generating..."
            : "Generate quote content"}
      </button>

      {isRefreshing ? (
        <p role="status" className="text-sm text-zinc-600">
          Quote content generated. Reloading the quote details...
        </p>
      ) : null}

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
