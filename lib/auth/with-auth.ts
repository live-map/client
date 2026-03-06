import * as Sentry from "@sentry/nextjs";

import { ERROR_MESSAGES } from "@/lib/constants/messages";
import type { ActionResult, AuthContext, AuthenticatedUser } from "@/lib/types/actions";
import { buildAuthHeaders, handleTokenRefreshResponse } from "@/lib/auth/tokens";

const API_BASE = process.env.API_URL || "http://localhost:8000";

/**
 * Get current user from backend /auth/me, sending both tokens.
 * The backend middleware auto-refreshes expired access tokens.
 */
async function getServerSession(): Promise<AuthenticatedUser | null> {
  const headers = await buildAuthHeaders();

  if (!headers["Authorization"] && !headers["X-Refresh-Token"]) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers,
    });

    // Handle auto-refreshed access token
    await handleTokenRefreshResponse(res);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      image: data.image,
    } as AuthenticatedUser;
  } catch {
    return null;
  }
}

/**
 * 인증이 필요한 Server Action을 래핑하는 HOF (Higher-Order Function)
 *
 * @example
 * export const createItem = withAuth(
 *   async (ctx, title: string): Promise<ActionResult<Item>> => {
 *     // ctx.user.id로 현재 사용자 접근 가능
 *     return { data: item };
 *   }
 * );
 */
export function withAuth<TArgs extends unknown[], TResult>(
  action: (ctx: AuthContext, ...args: TArgs) => Promise<ActionResult<TResult>>
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    const user = await getServerSession();

    if (!user?.id) {
      return { error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    const ctx: AuthContext = { user };

    try {
      return await action(ctx, ...args);
    } catch (error) {
      Sentry.captureException(error, { tags: { action: "withAuth" } });
      return { error: ERROR_MESSAGES.REQUEST_ERROR };
    }
  };
}
