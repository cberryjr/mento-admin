import { AppError } from "@/lib/errors/app-error";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import type { AuthSession } from "@/features/auth/session";
import { getServerAuthSession } from "@/server/auth/auth";

export async function requireSession(): Promise<AuthSession> {
  const session = await getServerAuthSession();

  if (!session?.user?.id || !session.user.email || !session.user.studioId) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "You must sign in to continue.");
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      studioId: session.user.studioId,
      role: session.user.role,
    },
    expires: session.expires,
  };
}
