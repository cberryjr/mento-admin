import { requireSession } from "@/features/auth/require-session";
import { WorkspaceHeader } from "@/components/app-shell/workspace-header";
import { WorkspaceNav } from "@/components/app-shell/workspace-nav";
import type { ReactNode } from "react";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-zinc-100">
      <WorkspaceHeader session={session} />
      <WorkspaceNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
