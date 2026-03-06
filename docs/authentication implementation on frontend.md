# Authentication Implementation on Frontend

## Overview

The frontend authentication system works with the backend's **stateless JWT token refresh middleware**. Every request to the backend sends both the access token and refresh token. If the access token is expired, the backend middleware automatically refreshes it and returns a new one via the `X-New-Access-Token` response header. The frontend then updates its cookie.

This means **no manual refresh logic** is needed on the frontend. The backend handles all refresh decisions transparently.

---

## Token Storage

Both tokens are stored as **httpOnly cookies** (not accessible via JavaScript for security):

| Cookie Name (Development) | Cookie Name (Production)         | Token Type  | Lifetime |
| ------------------------- | -------------------------------- | ----------- | -------- |
| `grapoll-access-token`    | `__Secure-grapoll-access-token`  | Access JWT  | 30 min   |
| `grapoll-refresh-token`   | `__Secure-grapoll-refresh-token` | Refresh JWT | 30 days  |

Cookie settings: `httpOnly: true`, `secure: true` (production), `sameSite: "lax"`, `path: "/"`.

---

## File Structure

```
client/
├── lib/auth/
│   ├── tokens.ts          # Shared token cookie helpers (central)
│   ├── session.ts          # Server-side session check (Server Components)
│   └── with-auth.ts        # HOF for authenticated Server Actions
├── config/
│   └── openapi-runtime.ts  # OpenAPI client config with token injection
├── lib/
│   └── api.ts              # Manual apiFetch() for poll endpoints
└── app/api/auth/
    └── me/route.ts         # API route for client-side session check
```

---

## How It Works

### 1. Shared Token Helpers (`lib/auth/tokens.ts`)

This is the **central module** that all other auth files import from. It eliminates duplicated cookie logic.

**Exports:**

| Function                            | Description                                                               |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `ACCESS_COOKIE`                     | Cookie name constant (env-aware)                                          |
| `REFRESH_COOKIE`                    | Cookie name constant (env-aware)                                          |
| `getAccessToken()`                  | Read access token from cookies (server-side)                              |
| `getRefreshToken()`                 | Read refresh token from cookies (server-side)                             |
| `updateAccessTokenCookie(newToken)` | Set a new access token cookie (silently fails in Server Components)       |
| `handleTokenRefreshResponse(res)`   | Check response for `X-New-Access-Token` header, update cookie if present  |
| `buildAuthHeaders()`                | Build `{ Authorization: "Bearer ...", "X-Refresh-Token": "..." }` headers |

**Key pattern** - Every backend call follows this flow:

```typescript
// 1. Build headers with both tokens
const headers = await buildAuthHeaders();

// 2. Make the request
const res = await fetch(url, { headers });

// 3. Handle auto-refreshed token
await handleTokenRefreshResponse(res);
```

### 2. Server Component Cookie Limitation

> **Important**: Next.js **Server Components** can only **read** cookies, not **write** them. `cookies().set()` throws an error in Server Components. Only **Server Actions** and **Route Handlers** can modify cookies.

`updateAccessTokenCookie()` wraps the `cookies().set()` call in a try/catch so it **silently fails** in Server Components. This is fine because:

- The backend middleware will refresh the token again on the next request.
- Server Actions and Route Handlers (where cookie writes succeed) will update the cookie when they can.
- The user experience is not affected — the refresh is transparent.

### 3. Server-Side Session Check (`lib/auth/session.ts`)

Used by **Server Components** to check if the user is authenticated.

```typescript
import { auth } from "@/lib/auth/session";

// In a Server Component or layout
const session = await auth();
if (!session) {
  redirect("/login");
}
// session.user.id, session.user.email, etc.
```

**How it works:**

1. Reads both tokens from cookies via `buildAuthHeaders()`.
2. Calls `GET /api/v1/auth/me` with both tokens.
3. If the backend refreshes the token, `handleTokenRefreshResponse()` attempts to update the cookie (silently fails in Server Components).
4. Returns `{ user: { id, email, name, image, role } }` or `null`.

### 4. Authenticated Server Actions (`lib/auth/with-auth.ts`)

A Higher-Order Function (HOF) that wraps Server Actions requiring authentication.

```typescript
export const createPoll = withAuth(
  async (ctx, data: PollCreateDto): Promise<ActionResult<Poll>> => {
    // ctx.user.id is the authenticated user
    // ... create poll logic
  }
);
```

**How it works internally:**

1. Calls `getServerSession()` which sends both tokens to `/api/v1/auth/me`.
2. Backend middleware auto-refreshes if needed, response updates the cookie.
3. If user is authenticated, passes `ctx.user` to the wrapped action.
4. If not authenticated, returns `{ error: "UNAUTHORIZED" }`.

### 5. Manual API Fetch (`lib/api.ts`)

Used for poll endpoints that aren't yet part of the generated OpenAPI client.

```typescript
// Every apiFetch call automatically:
// 1. Sends both tokens via buildAuthHeaders()
// 2. Handles X-New-Access-Token response via handleTokenRefreshResponse()

export const getPollFeed = async (sort, search, limit, offset) => {
  return apiFetch(`/api/v1/polls?${params}`, {
    next: { tags: ["polls"], revalidate: 60 },
  });
};
```

### 6. OpenAPI Client Config (`config/openapi-runtime.ts`)

The generated OpenAPI client (for posts, comments, media endpoints) is configured with a custom `fetch` wrapper.

```typescript
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: API_URL,
  async auth() {
    // Provides access token for Authorization header
    return getCookie(AUTH_COOKIE_NAME, { cookies });
  },
  async fetch(input, init) {
    // 1. Inject X-Refresh-Token header
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      const headers = new Headers(init?.headers);
      headers.set("X-Refresh-Token", refreshToken);
      init = { ...init, headers };
    }

    const response = await globalThis.fetch(input, init);

    // 2. Handle auto-refreshed token
    await handleTokenRefreshResponse(response);

    return response;
  },
});
```

This means **all OpenAPI client calls** (posts, comments, media, likes) automatically get token refresh support.

### 7. Client-Side Session Route (`app/api/auth/me/route.ts`)

This is a Next.js API route that the **client-side** (browser) calls to check session status (e.g., from a `useEffect` or SWR hook).

**Flow:**

1. Read both tokens from cookies.
2. If no tokens at all, return 401.
3. Call backend `/api/v1/auth/me` with both tokens.
4. If backend returns `X-New-Access-Token`, set it as a new cookie on the response.
5. If auth fails entirely, clear both cookies and return 401.
6. Return user data as JSON.

This was **simplified from ~108 lines to ~45 lines** by moving refresh logic to the backend middleware.

---

## Request Flow Diagrams

### Normal Request (Valid Access Token)

```
Browser/Server Component
    │
    ├─ buildAuthHeaders()
    │   → { Authorization: "Bearer <valid-access>", X-Refresh-Token: "<refresh>" }
    │
    ├─ fetch(backend_url, { headers })
    │
    │   [Backend Middleware]
    │   ├─ Decode access token → valid
    │   └─ Pass through (no refresh needed)
    │
    ├─ Response (no X-New-Access-Token header)
    │
    └─ handleTokenRefreshResponse() → no-op
```

### Expired Access Token (Auto-Refresh)

```
Browser/Server Component
    │
    ├─ buildAuthHeaders()
    │   → { Authorization: "Bearer <expired-access>", X-Refresh-Token: "<valid-refresh>" }
    │
    ├─ fetch(backend_url, { headers })
    │
    │   [Backend Middleware]
    │   ├─ Decode access token → ExpiredSignatureError
    │   ├─ Decode refresh token → valid
    │   ├─ Create new access token from refresh claims
    │   ├─ Inject new token into request Authorization header
    │   └─ Add X-New-Access-Token to response header
    │
    ├─ Response (has X-New-Access-Token: "<new-access>")
    │
    └─ handleTokenRefreshResponse()
        └─ updateAccessTokenCookie("<new-access>")
            → Cookie updated (Server Action / Route Handler)
            → Silently skipped (Server Component — next request refreshes again)
```

### Both Tokens Expired/Invalid

```
Browser/Server Component
    │
    ├─ buildAuthHeaders()
    │   → { Authorization: "Bearer <expired>", X-Refresh-Token: "<also-expired>" }
    │
    ├─ fetch(backend_url, { headers })
    │
    │   [Backend Middleware]
    │   ├─ Decode access token → ExpiredSignatureError
    │   ├─ Decode refresh token → ExpiredSignatureError
    │   └─ Pass through (no refresh possible)
    │
    │   [jwt_guard.py]
    │   └─ No valid access token → 401 Unauthorized
    │
    ├─ Response: 401
    │
    └─ Caller returns null / error
```

---

## Where Each File Is Used

| File                 | Used By                    | Context                          |
| -------------------- | -------------------------- | -------------------------------- |
| `tokens.ts`          | All other auth files       | Central token helpers            |
| `session.ts`         | Server Components, layouts | `auth()` for SSR session check   |
| `with-auth.ts`       | Server Actions             | `withAuth()` HOF for mutations   |
| `api.ts`             | Server Actions (polls)     | `apiFetch()` for poll endpoints  |
| `openapi-runtime.ts` | Generated OpenAPI client   | Posts, comments, media endpoints |
| `me/route.ts`        | Client-side (browser)      | SWR/useEffect session check      |

---

## Login Flow (Frontend Perspective)

```
1. User clicks OAuth button (Google/Kakao)
2. Frontend calls GET /api/v1/auth/oauth/{provider}/authorize
3. Frontend redirects user to OAuth provider URL
4. User consents, provider redirects back to frontend callback page
5. Frontend sends authorization code to POST /api/v1/auth/oauth/{provider}/callback
6. Backend returns { access_token, refresh_token, user }
7. Frontend stores both tokens as httpOnly cookies
8. Frontend redirects to home page
```

## Logout Flow (Frontend Perspective)

```
1. User clicks logout
2. Frontend calls POST /api/v1/auth/logout (no-op on server)
3. Frontend deletes both cookies (access + refresh)
4. Frontend redirects to home/login page
```

---

## Key Design Decisions

1. **No manual refresh on frontend**: All refresh logic is in the backend middleware. The frontend just sends both tokens and checks the response header. This means any new client (mobile app, desktop app) gets refresh for free.

2. **Shared `tokens.ts` module**: Previously, 5 different files each had their own cookie name constants and token reading logic. Now they all import from one place.

3. **httpOnly cookies**: Tokens are not accessible via JavaScript (`document.cookie`). This prevents XSS attacks from stealing tokens. The server-side Next.js code reads them via `cookies()` from `next/headers`.

4. **Two cookie name variants**: Development uses `grapoll-access-token`, production uses `__Secure-grapoll-access-token` (the `__Secure-` prefix is a browser security feature that ensures the cookie is only sent over HTTPS).

5. **Server Component cookie limitation**: Next.js Server Components can only read cookies, not write them. `updateAccessTokenCookie()` uses try/catch to silently handle this. The cookie gets updated on the next Server Action or Route Handler call instead. This does NOT affect user experience — the backend middleware refreshes the token on every request regardless.
