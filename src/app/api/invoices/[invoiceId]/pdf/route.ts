import { NextResponse } from "next/server";

import { requireSession } from "@/features/auth/require-session";
import { buildInvoicePdf } from "@/features/pdf/invoice-pdf";
import { loadStudioDefaults } from "@/features/studio-defaults/server/studio-defaults-repository";
import { getInvoiceById } from "@/features/invoices/server/invoices-repository";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { ensureStudioAccess } from "@/server/auth/permissions";
import { renderPdf } from "@/server/pdf/render-pdf";

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { invoiceId } = await context.params;
    const session = await requireSession();
    const invoice = await getInvoiceById(invoiceId);

    if (!invoice) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ERROR_CODES.UNKNOWN,
            message: "Invoice not found.",
          },
        },
        { status: 404 },
      );
    }

    ensureStudioAccess(session, invoice.studioId);

    const studioDefaults = await loadStudioDefaults(invoice.studioId);
    const pdf = renderPdf(
      buildInvoicePdf({
        invoice,
        studioName: studioDefaults?.studioName ?? null,
      }),
    );

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      const status =
        error.code === ERROR_CODES.UNAUTHORIZED
          ? 401
          : error.code === ERROR_CODES.FORBIDDEN
            ? 403
            : 400;

      return NextResponse.json(
        {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ERROR_CODES.UNKNOWN,
          message: "Could not generate invoice PDF.",
        },
      },
      { status: 500 },
    );
  }
}
