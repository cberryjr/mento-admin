import type { QuoteStatus } from "@/features/quotes/types";

type QuoteStatusChipProps = {
  status: QuoteStatus;
  className?: string;
};

const STATUS_STYLES: Record<QuoteStatus, string> = {
  draft: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  invoiced: "bg-purple-100 text-purple-800",
};

const FALLBACK_STYLE = "bg-zinc-100 text-zinc-700";

export function QuoteStatusChip({ status, className }: QuoteStatusChipProps) {
  return (
    <span
      aria-label={`Quote status: ${status}`}
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? FALLBACK_STYLE} ${className ?? ""}`.trim()}
    >
      {status}
    </span>
  );
}
