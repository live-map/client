/**
 * Auth 모듈 - 인증 유틸리티
 *
 * @example
 * // Client-side auth hook
 * import { useAuth } from "@/lib/auth/auth-context";
 *
 * // Server-side auth wrapper
 * import { withAuth } from "@/lib/auth";
 */

// Server-side session check
export { auth } from "./session";

// 인증 래퍼 HOF
export { withAuth } from "./with-auth";

// Client-side auth context
export { useAuth, AuthProvider } from "./auth-context";
