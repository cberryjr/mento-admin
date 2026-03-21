import type { ActionResult } from "@/lib/validation/action-result";
import { requireSession } from "@/features/auth/require-session";
import { getQuoteById as getQuoteRecordById } from "@/features/quotes/server/quotes-repository";
import type { QuotePreviewPayload } from "@/features/quotes/types";
import { calculateQuoteTotalCents } from "@/features/quotes/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { ensureStudioAccess } from "@/server/auth/permissions";

export async function getQuotePreview(
  quoteId: string,
): Promise<ActionResult<QuotePreviewPayload>> {
  try {
    const session = await requireSession();
    const quote = await getQuoteRecordById(quoteId);

    if (!quote) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Quote not found.",
        },
      };
    }

    // Return the same "not found" message regardless of whether the quote
    // belongs to another studio to prevent IDOR enumeration.
    try {
      ensureStudioAccess(session, quote.studioId);
    } catch {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Quote not found.",
        },
      };
    }

    // Load client details
    const { getClientById } = await import(
      "@/features/clients/server/queries/get-client-by-id"
    );
    const clientResult = await getClientById(quote.clientId);

    const clientName = clientResult.ok
      ? clientResult.data.client.name
      : "Unknown client";

    const clientContact = clientResult.ok
      ? {
          name: clientResult.data.client.contactName,
          email: clientResult.data.client.contactEmail,
          phone: clientResult.data.client.contactPhone,
        }
      : { name: "", email: "", phone: "" };

    // Load studio defaults for terms
    const { getStudioDefaults } = await import(
      "@/features/studio-defaults/server/queries/get-studio-defaults"
    );
    const defaultsResult = await getStudioDefaults();

    const studioName = defaultsResult.ok
      ? (defaultsResult.data.studioDefaults?.studioName ?? "")
      : "";

    // Quote-level terms override studio defaults
    const terms =
      quote.terms ||
      (defaultsResult.ok
        ? (defaultsResult.data.studioDefaults?.defaultQuoteTerms ?? "")
        : "");

    return {
      ok: true,
      data: {
        quoteId: quote.id,
        clientId: quote.clientId,
        quoteNumber: quote.quoteNumber,
        title: quote.title,
        status: quote.status,
        clientName,
        clientContact,
        sections: quote.sections,
        grandTotalCents: calculateQuoteTotalCents(quote.sections),
        terms,
        preparedAt: new Date().toISOString(),
        studioName,
      },
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    }

    return {
      ok: false,
      error: {
        code: ERROR_CODES.UNKNOWN,
        message: "Could not load quote preview.",
      },
    };
  }
}
