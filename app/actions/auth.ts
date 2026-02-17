"use server";

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
  const redirectUri = `${FRONTEND_URL}/api/auth/callback/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const res = await fetch(
    `${API_BASE}/api/v1/auth/oauth/${provider}/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`
  );

  if (!res.ok) {
    throw new Error("Failed to get authorization URL");
  }

  const data = await res.json();
  redirect(data.url);
}
