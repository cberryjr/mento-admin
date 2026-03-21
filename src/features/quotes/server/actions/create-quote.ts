"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/features/auth/require-session";
import { createQuoteRecord } from "@/features/quotes/server/quotes-repository";
import {
  createQuoteSchema,
  getCreateQuoteFieldErrors,
  type CreateQuoteSchemaInput,
} from "@/features/quotes/schemas/create-quote-schema";
import type { QuoteDetailRecord } from "@/features/quotes/types";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { ActionResult } from "@/lib/validation/action-result";
import { ensureStudioAccess } from "@/server/auth/permissions";
import { getClientByIdForStudio } from "@/features/clients/server/clients-repository";
import { listServicePackagesForStudio } from "@/features/service-packages/server/service-packages-repository";

function revalidateQuotePaths(quoteId: string) {
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function createQuote(
  input: CreateQuoteSchemaInput,
): Promise<ActionResult<{ quote: QuoteDetailRecord }>> {
  try {
    const session = await requireSession();
    ensureStudioAccess(session, session.user.studioId);

    const parsed = createQuoteSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Please correct the highlighted fields.",
          fieldErrors: getCreateQuoteFieldErrors(parsed.error),
        },
      };
    }

    const client = await getClientByIdForStudio(
      session.user.studioId,
      parsed.data.clientId,
    );

    if (!client) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "Selected client not found.",
          fieldErrors: { clientId: ["Select a valid client."] },
        },
      };
    }

    const availableServicePackages = await listServicePackagesForStudio(
      session.user.studioId,
    );
    const availableServicePackageIds = new Set(
      availableServicePackages.map((servicePackage) => servicePackage.id),
    );
    const hasInvalidServicePackageId = parsed.data.selectedServicePackageIds.some(
      (servicePackageId) => !availableServicePackageIds.has(servicePackageId),
    );

    if (hasInvalidServicePackageId) {
      return {
        ok: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: "One or more selected service packages are no longer available.",
          fieldErrors: {
            selectedServicePackageIds: ["Select valid service packages."],
          },
        },
      };
    }

    const quote = await createQuoteRecord(session.user.studioId, parsed.data);
    revalidateQuotePaths(quote.id);

    return {
      ok: true,
      data: {
        quote,
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
        message: "Could not create quote.",
      },
    };
  }
}
