import { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE, buildAuthHeaders } from "@/lib/auth/tokens";

const API_BASE = process.env.API_URL || "http://localhost:8000";

export async function GET() {
  const headers = await buildAuthHeaders();

  // No tokens at all → 401
  if (!headers["Authorization"] && !headers["X-Refresh-Token"]) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, { headers });

    // Handle auto-refreshed access token from backend middleware
    const newToken = res.headers.get("x-new-access-token");

    if (!res.ok) {
      // Auth failed even after backend refresh attempt — clear cookies
      const response = NextResponse.json(null, { status: 401 });
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      return response;
    }

    const userData = await res.json();
    const response = NextResponse.json(userData);

    // If backend refreshed the token, update the cookie
    if (newToken) {
      response.cookies.set(ACCESS_COOKIE, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 60, // 30 minutes
      });
    }

    return response;
  } catch {
    return NextResponse.json(null, { status: 401 });
  }
}
