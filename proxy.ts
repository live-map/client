import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Next.js 16 Proxy (replaces middleware.ts)
 *
 * Handles authentication-based route protection.
 *
 * @see https://authjs.dev/getting-started/session-management/protecting
 */

/** Routes that require authentication */
const PROTECTED_PATTERNS = [/^\/profile/, /^\/polls\/[^/]+\/edit/];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PATTERNS.some((pattern) => pattern.test(pathname));
}

export default async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;

  // Route patterns
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  const isAuthPage = nextUrl.pathname.startsWith("/auth/");

  // Allow NextAuth API routes
  if (isApiAuth) return NextResponse.next();

  // Redirect logged-in users from auth pages to home
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Redirect unauthenticated users from protected routes to signin
  if (isProtectedRoute(nextUrl.pathname) && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
