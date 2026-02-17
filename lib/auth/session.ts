import { cookies } from "next/headers";

const API_BASE = process.env.API_URL || "http://localhost:8000";
const ACCESS_COOKIE =
  process.env.NODE_ENV === "production" ? "__Secure-grapoll-access-token" : "grapoll-access-token";

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
 * Reads the access token from cookies and validates it against the backend.
 * Use in Server Components and Server Actions.
 *
 * @returns Session object or null if not authenticated
 */
export async function auth(): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

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
