import { redirect } from "next/navigation";

import { SignInForm } from "@/features/auth/sign-in-form";
import { getServerAuthSession } from "@/server/auth/auth";

type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await getServerAuthSession();

  if (session?.user?.id) {
    redirect("/workspace");
  }

  const params = (await searchParams) ?? {};
  const callback = params.callbackUrl;
  const callbackUrl =
    typeof callback === "string" && callback.startsWith("/")
      ? callback
      : "/workspace";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <section className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mb-6 text-sm text-zinc-600">
          Use your studio owner credentials to access the protected workspace.
        </p>
        <SignInForm callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
