"use server";

import { signIn as nextAuthSignIn } from "@/lib/auth";

/**
 * OAuth 로그인 (Google, Kakao)
 */
export async function signInWithOAuth(
  provider: "google" | "kakao",
  callbackUrl = "/"
): Promise<void> {
  await nextAuthSignIn(provider, { redirectTo: callbackUrl });
}
