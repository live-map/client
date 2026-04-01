"use client";

import { useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useLoginModal } from "@/components/auth/login-modal";

/**
 * 인증이 필요한 액션에서 사용하는 훅.
 * pre-check (requireAuth) + post-check (isAuthError) 패턴 제공.
 */
export function useAuthAction() {
  const { user, status } = useAuth();
  const { openLoginModal } = useLoginModal();

  const isAuthenticated = status === "authenticated" && !!user;

  /** 액션 전 로그인 여부 확인. 미로그인 시 모달 표시 후 false 반환. */
  const requireAuth = useCallback(
    (message?: string): boolean => {
      if (!isAuthenticated) {
        openLoginModal(message);
        return false;
      }
      return true;
    },
    [isAuthenticated, openLoginModal]
  );

  /** 서버 액션 결과에서 401 감지 시 로그인 모달 표시. true면 401이었음. */
  const isAuthError = useCallback(
    (result: { error?: string; status?: number }, message?: string): boolean => {
      if (result.status === 401) {
        openLoginModal(message ?? "로그인이 필요합니다");
        return true;
      }
      return false;
    },
    [openLoginModal]
  );

  return { isAuthenticated, requireAuth, isAuthError };
}
