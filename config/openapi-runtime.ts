import { CreateClientConfig } from "@/generated/openapi-client/client.gen";
import { getCookie } from "cookies-next/server";
import { cookies } from "next/headers";

import { getRefreshToken, handleTokenRefreshResponse } from "@/lib/auth/tokens";

const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Secure-grapoll-access-token" : "grapoll-access-token";

const API_URL = process.env.API_URL || "http://localhost:8000";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: API_URL,
  async auth() {
    return getCookie(AUTH_COOKIE_NAME, { cookies });
  },
  async fetch(input, init) {
    // Inject refresh token header
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      const headers = new Headers(init?.headers);
      headers.set("X-Refresh-Token", refreshToken);
      init = { ...init, headers };
    }

    const response = await globalThis.fetch(input, init);

    // Handle auto-refreshed access token from backend middleware
    await handleTokenRefreshResponse(response);

    return response;
  },
});
