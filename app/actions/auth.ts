"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE = process.env.API_URL || "http://localhost:8000";
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * OAuth 로그인 - 사용자를 OAuth 제공자 인증 페이지로 리다이렉트
 */
export async function signInWithOAuth(
  provider: "google" | "kakao",
  callbackUrl = "/"
): Promise<void> {
  // Open Redirect 방지: 앱 내부 경로만 허용
  const safeCallbackUrl =
    callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  // callbackUrl을 임시 쿠키에 저장
  cookieStore.set("auth-callback-url", safeCallbackUrl, {
    path: "/",
    maxAge: 600,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
  });

  const redirectUri = `${FRONTEND_URL}/api/auth/callback/${provider}`;

  const res = await fetch(
    `${API_BASE}/api/v1/auth/oauth/${provider}/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`
  );

  if (!res.ok) {
    throw new Error("Failed to get authorization URL");
  }

  const data = await res.json();

  // CSRF 방지: backend가 생성한 state를 쿠키에 저장 (callback에서 비교용)
  cookieStore.set("auth-state", data.state, {
    path: "/",
    maxAge: 600,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
  });

  redirect(data.url);
}
