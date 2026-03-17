"use server";

import { ensureStudioAccess } from "@/server/auth/permissions";
import { requireSession } from "@/features/auth/require-session";

export async function updateWorkspaceName(studioId: string, name: string) {
  const session = await requireSession();
  ensureStudioAccess(session, studioId);

  return {
    ok: true,
    data: {
      studioId,
      name,
    },
  };
}
