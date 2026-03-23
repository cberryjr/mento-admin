import { sanitizeRecordHistoryHref } from "@/lib/navigation/record-history";
import { sanitizeQuoteBackTo } from "@/features/quotes/lib/navigation";

const DEFAULT_INVOICE_BACK_TO = "/invoices";
const QUOTE_DETAIL_PATH_PATTERN = /^\/quotes\/[^/]+$/;

function buildInvoiceListBackTo(parsedBackTo: URL): string {
  const search = parsedBackTo.searchParams.get("search");

  if (!search) {
    return DEFAULT_INVOICE_BACK_TO;
  }

  return `${DEFAULT_INVOICE_BACK_TO}?search=${encodeURIComponent(search)}`;
}

function buildQuoteDetailBackTo(parsedBackTo: URL): string {
  const params = new URLSearchParams();

  params.set(
    "backTo",
    sanitizeQuoteBackTo(parsedBackTo.searchParams.get("backTo") ?? undefined),
  );

  const preview = parsedBackTo.searchParams.get("preview");
  if (preview) {
    params.set("preview", preview);
  }

  const saved = parsedBackTo.searchParams.get("saved");
  if (saved) {
    params.set("saved", saved);
  }

  return `${parsedBackTo.pathname}?${params.toString()}`;
}

export function sanitizeInvoiceBackTo(backTo?: string): string {
  const safeHistoryHref = sanitizeRecordHistoryHref(backTo);

  if (safeHistoryHref) {
    return safeHistoryHref;
  }

  if (!backTo || !backTo.startsWith("/") || backTo.startsWith("//")) {
    return DEFAULT_INVOICE_BACK_TO;
  }

  try {
    const parsedBackTo = new URL(backTo, "https://mento-admin.local");

    if (parsedBackTo.pathname === DEFAULT_INVOICE_BACK_TO) {
      return buildInvoiceListBackTo(parsedBackTo);
    }

    if (QUOTE_DETAIL_PATH_PATTERN.test(parsedBackTo.pathname)) {
      return buildQuoteDetailBackTo(parsedBackTo);
    }

    return DEFAULT_INVOICE_BACK_TO;
  } catch {
    return DEFAULT_INVOICE_BACK_TO;
  }
}

export function buildInvoiceDetailHref(invoiceId: string, backTo?: string): string {
  return `/invoices/${invoiceId}?backTo=${encodeURIComponent(
    sanitizeInvoiceBackTo(backTo),
  )}`;
}

export function buildInvoicePreviewHref(invoiceId: string, backTo?: string): string {
  return `/invoices/${invoiceId}/preview?backTo=${encodeURIComponent(
    sanitizeInvoiceBackTo(backTo),
  )}`;
}
