import { NextResponse } from "next/server";

import { requireSession } from "@/features/auth/require-session";
import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";

export async function GET() {
  try {
    const session = await requireSession();

    return NextResponse.json(
      {
        ok: true,
        data: {
          workspaceId: session.user.studioId,
          ownerEmail: session.user.email,
        },
      },
      { status: 200 },
    );
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

    throw error;
  }
}
