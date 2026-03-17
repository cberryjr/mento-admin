import type { ActionResult } from "@/lib/validation/action-result";

export type QuoteSummary = {
  id: string;
  title: string;
  status: "draft" | "accepted";
};

export async function listQuotes(): Promise<
  ActionResult<{ quotes: QuoteSummary[] }> & { meta?: { total: number } }
> {
  const quotes: QuoteSummary[] = [];

  return {
    ok: true,
    data: {
      quotes,
    },
    meta: {
      total: quotes.length,
    },
  };
}
