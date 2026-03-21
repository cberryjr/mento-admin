import { notFound, redirect } from "next/navigation";

import { getQuotePreview } from "@/features/quotes/server/queries/get-quote-preview";
import { QuotePreview } from "@/features/quotes/components/quote-preview";
import { buildQuoteDetailHref, sanitizeQuoteBackTo } from "@/features/quotes/lib/navigation";
import { computeReadinessIssues } from "@/features/quotes/lib/preview-readiness";

type QuotePreviewPageProps = {
  params: Promise<{ quoteId: string }>;
  searchParams: Promise<{ backTo?: string }>;
};

export default async function QuotePreviewPage({
  params,
  searchParams,
}: QuotePreviewPageProps) {
  const { quoteId } = await params;
  const { backTo } = await searchParams;
  const safeBackTo = sanitizeQuoteBackTo(backTo);
  const detailHref = buildQuoteDetailHref(quoteId, safeBackTo);

  const result = await getQuotePreview(quoteId);

  if (!result.ok) {
    notFound();
  }

  const { data: payload } = result;

  if (payload.sections.length === 0) {
    const unavailableParams = new URLSearchParams({
      backTo: safeBackTo,
      preview: "unavailable",
    });
    redirect(`/quotes/${quoteId}?${unavailableParams.toString()}`);
  }

  const readinessIssues = computeReadinessIssues(payload.sections, payload.clientId);

  if (readinessIssues.length > 0) {
    const blockedParams = new URLSearchParams({
      backTo: safeBackTo,
      preview: "blocked",
    });
    redirect(`/quotes/${quoteId}?${blockedParams.toString()}`);
  }

  return (
    <section className="space-y-6">
      <QuotePreview payload={payload} editorHref={detailHref} />
    </section>
  );
}
