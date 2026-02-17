import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = process.env.API_URL || "http://localhost:8000";
const ACCESS_COOKIE =
  process.env.NODE_ENV === "production" ? "__Secure-grapoll-access-token" : "grapoll-access-token";
const REFRESH_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-grapoll-refresh-token"
    : "grapoll-refresh-token";

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    // Try to refresh
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
    if (!refreshToken) {
      return NextResponse.json(null, { status: 401 });
    }

    const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!refreshRes.ok) {
      // Refresh failed — clear cookies
      const res = NextResponse.json(null, { status: 401 });
      res.cookies.delete(ACCESS_COOKIE);
      res.cookies.delete(REFRESH_COOKIE);
      return res;
    }

    const refreshData = await refreshRes.json();
    accessToken = refreshData.access_token;

    // Set the new access token cookie
    const res = await fetchMe(accessToken!);
    if (res.ok) {
      const userData = await res.json();
      const response = NextResponse.json(userData);
      response.cookies.set(ACCESS_COOKIE, accessToken!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 60, // 30 minutes
      });
      return response;
    }

    return NextResponse.json(null, { status: 401 });
  }

  // We have an access token — call backend /auth/me
  const res = await fetchMe(accessToken);
  if (res.ok) {
    const userData = await res.json();
    return NextResponse.json(userData);
  }

  // Access token invalid — try refresh
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json(null, { status: 401 });
  }

  const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!refreshRes.ok) {
    const response = NextResponse.json(null, { status: 401 });
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  const refreshData = await refreshRes.json();
  const newAccessToken = refreshData.access_token;

  const retryRes = await fetchMe(newAccessToken);
  if (!retryRes.ok) {
    return NextResponse.json(null, { status: 401 });
  }

  const userData = await retryRes.json();
  const response = NextResponse.json(userData);
  response.cookies.set(ACCESS_COOKIE, newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60,
  });
  return response;
}

async function fetchMe(accessToken: string) {
  return fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
