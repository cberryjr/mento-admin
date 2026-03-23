const RECORD_HISTORY_PATH = "/records/history";

const VALID_ENTITY_TYPES = new Set(["client", "quote", "invoice"]);

function sanitizeRelativePath(path?: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  try {
    const parsedPath = new URL(path, "https://mento-admin.local");
    return `${parsedPath.pathname}${parsedPath.search}${parsedPath.hash}`;
  } catch {
    return null;
  }
}

export function sanitizeRecordHistoryHref(href?: string): string | null {
  const safeHref = sanitizeRelativePath(href);

  if (!safeHref) {
    return null;
  }

  try {
    const parsedHref = new URL(safeHref, "https://mento-admin.local");

    if (parsedHref.pathname !== RECORD_HISTORY_PATH) {
      return null;
    }

    const entityType = parsedHref.searchParams.get("type");
    const entityId = parsedHref.searchParams.get("id")?.trim();

    if (!entityType || !VALID_ENTITY_TYPES.has(entityType) || !entityId) {
      return null;
    }

    const params = new URLSearchParams({
      type: entityType,
      id: entityId,
    });

    const backTo = sanitizeRelativePath(parsedHref.searchParams.get("backTo"));

    if (backTo) {
      params.set("backTo", backTo);
    }

    return `${RECORD_HISTORY_PATH}?${params.toString()}`;
  } catch {
    return null;
  }
}

export function buildRecordHistoryHref(input: {
  entityType: "client" | "quote" | "invoice";
  entityId: string;
  backTo?: string;
}): string {
  const params = new URLSearchParams({
    type: input.entityType,
    id: input.entityId,
  });

  const safeBackTo = sanitizeRelativePath(input.backTo);

  if (safeBackTo) {
    params.set("backTo", safeBackTo);
  }

  return `${RECORD_HISTORY_PATH}?${params.toString()}`;
}
