"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/require-session";
import { getQuoteById } from "@/features/quotes/server/queries/get-quote-by-id";
import {
  saveQuoteSections,
  setQuoteGeneratedAt,
} from "@/features/quotes/server/quotes-repository";
import {
  generateQuoteSchema,
  getGenerateQuoteFieldErrors,
  type GenerateQuoteSchemaInput,
} from "@/features/quotes/schemas/generate-quote-schema";
import type {
  QuoteDetailRecord,
  QuoteLineItemRecord,
  QuoteSectionRecord,
} from "@/features/quotes/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";
import { getServicePackageById } from "@/features/service-packages/server/queries/get-service-package-by-id";
import type { ServicePackageDetailRecord } from "@/features/service-packages/types";

function revalidateQuotePaths(quoteId: string) {
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

function buildQuoteSectionsFromPackages(
  quoteId: string,
  studioId: string,
  packages: ServicePackageDetailRecord[],
): QuoteSectionRecord[] {
  let globalPosition = 1;
  const sections: QuoteSectionRecord[] = [];

  for (const pkg of packages) {
    for (const section of pkg.sections) {
      const sectionId = randomUUID();
      const lineItems: QuoteLineItemRecord[] = section.lineItems.map(
        (li, liIndex) => ({
          id: randomUUID(),
          quoteId,
          quoteSectionId: sectionId,
          studioId,
          name: li.name,
          content: li.defaultContent,
          quantity: li.quantity,
          unitLabel: li.unitLabel,
          unitPriceCents: li.unitPriceCents,
          lineTotalCents: li.quantity * li.unitPriceCents,
          position: liIndex + 1,
        }),
      );

      sections.push({
        id: sectionId,
        quoteId,
        studioId,
        sourceServicePackageId: pkg.id,
        title: section.title,
        content: section.defaultContent,
        position: globalPosition++,
        lineItems,
      });
    }
  }

  return sections;
}

export async function generateQuoteContent(
  input: GenerateQuoteSchemaInput,
): Promise<ActionResult<{ quote: QuoteDetailRecord }>> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    const parsed = generateQuoteSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Please correct the highlighted fields.",
          fieldErrors: getGenerateQuoteFieldErrors(parsed.error),
        },
      };
    }

    const quoteResult = await getQuoteById(parsed.data.quoteId);

    if (!quoteResult.ok) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Quote not found.",
        },
      };
    }

    const { quote } = quoteResult.data;

    if (quote.status !== "draft") {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Only draft quotes can be generated.",
        },
      };
    }

    if (quote.selectedServicePackageIds.length === 0) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "No service packages selected for this quote.",
        },
      };
    }

    const servicePackages: ServicePackageDetailRecord[] = [];

    for (const spId of quote.selectedServicePackageIds) {
      const spResult = await getServicePackageById(spId);

      if (!spResult.ok) {
        return {
          ok: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Service package ${spId} not found or no longer available.`,
          },
        };
      }

      if (spResult.data.servicePackage.studioId !== session.user.studioId) {
        return {
          ok: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: "One or more selected service packages are not accessible.",
          },
        };
      }

      servicePackages.push(spResult.data.servicePackage);
    }

    const sections = buildQuoteSectionsFromPackages(
      quote.id,
      session.user.studioId,
      servicePackages,
    );

    const now = new Date();

    await saveQuoteSections(quote.id, session.user.studioId, sections);
    await setQuoteGeneratedAt(quote.id, now);

    revalidateQuotePaths(quote.id);

    const updatedQuote = await getQuoteById(quote.id);

    if (!updatedQuote.ok) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Quote was generated but could not be reloaded.",
        },
      };
    }

    return {
      ok: true,
      data: {
        quote: updatedQuote.data.quote,
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
        message: "Could not generate quote content.",
      },
    };
  }
}
