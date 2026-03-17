/**
 * Formats an ISO 8601 date string for display in the UI.
 * Renders in UTC so server-rendered and client-rendered output match.
 * Example: "2026-03-14T09:15:00.000Z" → "Mar 14, 2026"
 */
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
