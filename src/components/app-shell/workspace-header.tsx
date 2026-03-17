import type { AuthSession } from "@/features/auth/session";

type WorkspaceHeaderProps = {
  session: AuthSession;
};

export function WorkspaceHeader({ session }: WorkspaceHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Mento Admin
          </p>
          <h1 className="text-xl font-semibold text-zinc-900">Studio Workspace</h1>
        </div>

        <p className="text-sm text-zinc-600">Signed in as {session.user.email}</p>
      </div>
    </header>
  );
}
