/**
 * Auth 모듈 - NextAuth 설정 및 인증 유틸리티
 *
 * @example
 * // NextAuth 핸들러 및 함수
 * import { auth, signIn, signOut, handlers } from "@/lib/auth";
 *
 * // 인증 래퍼 HOF
 * import { withAuth } from "@/lib/auth";
 *
 * // 소유권 검증
 * import { verifyItemOwnership } from "@/lib/auth";
 */

// NextAuth 설정 및 핸들러
export { auth, handlers, signIn, signOut } from "./config";

// 인증 래퍼 HOF
export { withAuth } from "./with-auth";

// 소유권 검증
export { type OwnershipResult } from "./ownership";
