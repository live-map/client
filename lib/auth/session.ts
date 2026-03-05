import { buildAuthHeaders, handleTokenRefreshResponse } from "@/lib/auth/tokens";

const API_BASE = process.env.API_URL || "http://localhost:8000";

interface ServerSession {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    role: string;
  };
}

/**
 * Server-side session check.
 * Reads both tokens from cookies and validates against the backend.
 * The backend middleware auto-refreshes expired access tokens.
 *
 * @returns Session object or null if not authenticated
 */
export async function auth(): Promise<ServerSession | null> {
  const headers = await buildAuthHeaders();

  if (!headers["Authorization"] && !headers["X-Refresh-Token"]) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers,
      cache: "no-store",
    });

    // Handle auto-refreshed access token
    await handleTokenRefreshResponse(res);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return {
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image,
        role: data.role,
      },
    };
  } catch {
    return null;
  }
}
