import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { AuthSession } from "@/features/auth/session";

export function canAccessStudio(session: AuthSession, studioId: string) {
  return session.user.role === "owner" && session.user.studioId === studioId;
}

export function ensureStudioAccess(session: AuthSession | null | undefined, studioId: string) {
  if (!session?.user?.role || !session?.user?.studioId) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "You must sign in to continue.");
  }
  if (!canAccessStudio(session, studioId)) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "You are not allowed to access this workspace.");
  }
}
