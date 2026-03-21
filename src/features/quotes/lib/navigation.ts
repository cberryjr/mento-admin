const DEFAULT_BACK_TO = "/quotes";

function appendSavedParam(params: URLSearchParams, saved?: string) {
  if (saved) {
    params.set("saved", saved);
  }
}

export function sanitizeQuoteBackTo(backTo?: string) {
  if (!backTo || !backTo.startsWith("/") || backTo.startsWith("//")) {
    return DEFAULT_BACK_TO;
  }

  try {
    const parsedBackTo = new URL(backTo, "https://mento-admin.local");

    if (parsedBackTo.pathname !== DEFAULT_BACK_TO) {
      return DEFAULT_BACK_TO;
    }

    const search = parsedBackTo.searchParams.get("search");
    if (!search) {
      return DEFAULT_BACK_TO;
    }

    return `${DEFAULT_BACK_TO}?search=${encodeURIComponent(search)}`;
  } catch {
    return DEFAULT_BACK_TO;
  }
}

export function buildQuoteDetailHref(
  quoteId: string,
  backTo?: string,
  saved?: string,
) {
  const safeBackTo = sanitizeQuoteBackTo(backTo);
  const params = new URLSearchParams({ backTo: safeBackTo });

  appendSavedParam(params, saved);

  return `/quotes/${quoteId}?${params.toString()}`;
}

export function buildQuoteRevisionReadyHref(quoteId: string, backTo?: string) {
  return buildQuoteDetailHref(quoteId, backTo, "revised");
}

export function buildQuotePreviewHref(
  quoteId: string,
  backTo?: string,
  saved?: string,
) {
  const safeBackTo = sanitizeQuoteBackTo(backTo);
  const params = new URLSearchParams({ backTo: safeBackTo });

  appendSavedParam(params, saved);

  return `/quotes/${quoteId}/preview?${params.toString()}`;
}
