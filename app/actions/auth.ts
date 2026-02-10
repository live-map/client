"use server";

import bcrypt from "bcryptjs";
import * as Sentry from "@sentry/nextjs";
import { signIn as nextAuthSignIn } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ERROR_MESSAGES } from "@/lib/constants/messages";
import type { ActionResult } from "@/lib/types/actions";
import { signInSchema, registerSchema } from "@/lib/validations/auth";

/**
 * 이메일/비밀번호 로그인
 */
export async function signInWithCredentials(formData: FormData): Promise<ActionResult> {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      return { error: validation.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT };
    }

    await nextAuthSignIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });

    return { data: null };
  } catch (error) {
    // NextAuth redirect는 에러로 throw됨
    if ((error as Error).message?.includes("NEXT_REDIRECT")) {
      throw error;
    }

    Sentry.captureException(error, { tags: { action: "signInWithCredentials" } });
    return { error: ERROR_MESSAGES.INVALID_CREDENTIALS };
  }
}

/**
 * OAuth 로그인 (Google, Discord)
 */
export async function signInWithOAuth(provider: "google" | "discord"): Promise<void> {
  await nextAuthSignIn(provider, { redirectTo: "/" });
}

/**
 * 회원가입
 */
export async function register(formData: FormData): Promise<ActionResult> {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const validation = registerSchema.safeParse({ name, email, password, confirmPassword });
    if (!validation.success) {
      return { error: validation.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT };
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: ERROR_MESSAGES.EMAIL_ALREADY_EXISTS };
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12);

    // 사용자 생성
    await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    });

    // 자동 로그인
    await nextAuthSignIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });

    return { data: null };
  } catch (error) {
    // NextAuth redirect는 에러로 throw됨
    if ((error as Error).message?.includes("NEXT_REDIRECT")) {
      throw error;
    }

    Sentry.captureException(error, { tags: { action: "register" } });
    return { error: ERROR_MESSAGES.REQUEST_ERROR };
  }
}
