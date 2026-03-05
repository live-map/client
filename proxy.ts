import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (replaces middleware.ts)
 *
 * Handles authentication-based route protection.
 * Checks for the presence of access or refresh token cookies.
 */

/** Routes that require authentication */
const PROTECTED_PATTERNS = [/^\/profile/, /^\/polls\/[^/]+\/edit/];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PATTERNS.some((pattern) => pattern.test(pathname));
}

const ACCESS_COOKIE = "grapoll-access-token";
const ACCESS_COOKIE_SECURE = "__Secure-grapoll-access-token";
const REFRESH_COOKIE = "grapoll-refresh-token";
const REFRESH_COOKIE_SECURE = "__Secure-grapoll-refresh-token";


export default async function proxy(request: NextRequest) {
  const { nextUrl } = request;

  // Check if user has any auth cookie (access or refresh)
  const hasAccessToken = !!(
    request.cookies.get(ACCESS_COOKIE)?.value || request.cookies.get(ACCESS_COOKIE_SECURE)?.value
  );
  const hasRefreshToken = !!(
    request.cookies.get(REFRESH_COOKIE)?.value || request.cookies.get(REFRESH_COOKIE_SECURE)?.value
  );
  const isLoggedIn = hasAccessToken || hasRefreshToken;

  // Route patterns
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
  const isAuthPage = nextUrl.pathname.startsWith("/auth/");

  // Allow auth API routes
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
