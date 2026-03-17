"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type SignInFormProps = {
  callbackUrl: string;
};

export function resolveSafeRedirectPath(
  responseUrl: string | null | undefined,
  fallbackPath: string,
) {
  if (!responseUrl) {
    return fallbackPath;
  }

  if (responseUrl.startsWith("/")) {
    return responseUrl;
  }

  try {
    const parsed = new URL(responseUrl);
    if (parsed.origin === window.location.origin) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return fallbackPath;
  }

  return fallbackPath;
}

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsPending(true);
    setErrorMessage(null);

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!response || response.error) {
        setErrorMessage("Invalid email or password.");
        return;
      }

      const nextPath = resolveSafeRedirectPath(response.url, callbackUrl);
      router.push(nextPath);
      router.refresh();
    } catch {
      setErrorMessage("Sign-in failed due to a temporary issue. Please retry.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-4" aria-label="Sign-in form">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-900" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      {errorMessage ? (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
