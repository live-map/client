import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_URL || "http://localhost:8000";
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ACCESS_COOKIE =
  process.env.NODE_ENV === "production" ? "__Secure-grapoll-access-token" : "grapoll-access-token";
const REFRESH_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-grapoll-refresh-token"
    : "grapoll-refresh-token";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/signin?error=no_code", FRONTEND_URL));
  }

  const redirectUri = `${FRONTEND_URL}/api/auth/callback/${provider}`;

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/oauth/${provider}/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        state,
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/auth/signin?error=auth_failed", FRONTEND_URL));
    }

    const data = await res.json();

    const response = NextResponse.redirect(new URL(callbackUrl, FRONTEND_URL));

    response.cookies.set(ACCESS_COOKIE, data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60,
    });

    response.cookies.set(REFRESH_COOKIE, data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.redirect(new URL("/auth/signin?error=server_error", FRONTEND_URL));
  }
}
