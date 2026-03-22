import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

type RequestLike = NextRequest | Request;

function getPathname(request: RequestLike) {
  if ("nextUrl" in request) {
    return request.nextUrl.pathname;
  }

  return new URL(request.url).pathname;
}

function getRequestUrl(request: RequestLike) {
  if ("nextUrl" in request) {
    return request.nextUrl;
  }

  return new URL(request.url);
}

export async function proxy(request: RequestLike) {
  const pathname = getPathname(request);
  const requestUrl = getRequestUrl(request);
  const token = await getToken({ req: request as NextRequest });

  const protectedPaths = [
    "/workspace",
    "/settings",
    "/clients",
    "/service-packages",
    "/quotes",
    "/invoices",
  ];
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isProtectedPath && !token) {
    const signInUrl = new URL("/sign-in", requestUrl);
    const callbackUrl = `${pathname}${requestUrl.search}`;
    signInUrl.searchParams.set("callbackUrl", callbackUrl);

    return NextResponse.redirect(signInUrl);
  }

  if (pathname === "/sign-in" && token) {
    const workspaceUrl = new URL("/workspace", requestUrl);
    return NextResponse.redirect(workspaceUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/settings/:path*",
    "/clients/:path*",
    "/service-packages/:path*",
    "/quotes/:path*",
    "/invoices/:path*",
    "/sign-in",
  ],
};
