import { cookies } from "next/headers";

export const ACCESS_COOKIE =
  process.env.NODE_ENV === "production" ? "__Secure-grapoll-access-token" : "grapoll-access-token";
export const REFRESH_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-grapoll-refresh-token"
    : "grapoll-refresh-token";

/**
 * Read the access token from cookies (server-side only).
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(ACCESS_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Read the refresh token from cookies (server-side only).
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(REFRESH_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Update the access token cookie with a new value.
 * Silently fails in Server Components (cookies are read-only there).
 */
export async function updateAccessTokenCookie(newToken: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ACCESS_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60, // 30 minutes
    });
  } catch {
    // Server Components can't modify cookies — that's fine.
    // The backend middleware will refresh again on the next request.
  }
}

/**
 * Check a fetch Response for the X-New-Access-Token header.
 * If present, update the cookie with the refreshed token.
 */
export async function handleTokenRefreshResponse(res: Response): Promise<void> {
  const newToken = res.headers.get("x-new-access-token");
  if (newToken) {
    await updateAccessTokenCookie(newToken);
  }
}

/**
 * Build Authorization + X-Refresh-Token headers for backend requests.
 */
export async function buildAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  if (refreshToken) {
    headers["X-Refresh-Token"] = refreshToken;
  }
  return headers;
}
