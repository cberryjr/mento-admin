import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth/auth-options";

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
