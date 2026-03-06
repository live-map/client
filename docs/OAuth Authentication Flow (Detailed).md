# OAuth Authentication Flow — Detailed Code Walkthrough

## Overview

This document traces the **complete OAuth authentication flow** from the moment a user clicks "Login" to the point where they are authenticated and their session is maintained. Each phase maps to the OAuth Authorization Code Grant flow and includes line-by-line code explanations.

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌────────┐
│  Browser  │────▸│ Next.js  │────▸│ FastAPI  │────▸│ OAuth Provider│────▸│   DB   │
│  (User)   │◂────│ Frontend │◂────│ Backend  │◂────│ (Google/Kakao)│     │(Postgres)│
└──────────┘     └──────────┘     └──────────┘     └──────────────┘     └────────┘
```

**Actors:**

- **Browser**: User's web browser (React client components)
- **Next.js Frontend**: Server Actions, API Route Handlers, Server Components
- **FastAPI Backend**: Auth controller, service, middleware, JWT guard
- **OAuth Provider**: Google or Kakao authorization/resource servers
- **DB**: PostgreSQL database (users, accounts tables)

---

## Phase 1: User Clicks Login — Initiate OAuth

> **Flow**: Browser → Next.js Server Action → FastAPI Backend → Return Authorization URL

The user clicks a login button (e.g., "Google로 로그인"). This triggers the `signInWithOAuth` Server Action.

### File: `client/app/actions/auth.ts`

```typescript
"use server"; // [1]

import { cookies } from "next/headers"; // [2]
import { redirect } from "next/navigation"; // [3]

const API_BASE = process.env.API_URL || "http://localhost:8000"; // [4]
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // [5]

export async function signInWithOAuth( // [6]
  provider: "google" | "kakao", // [7]
  callbackUrl = "/" // [8]
): Promise<void> {
  const cookieStore = await cookies(); // [9]
  cookieStore.set("auth-callback-url", callbackUrl, {
    // [10]
    path: "/",
    maxAge: 600,
    httpOnly: true,
    sameSite: "lax",
  });

  const redirectUri = `${FRONTEND_URL}/api/auth/callback/${provider}`; // [11]

  const res = await fetch(
    // [12]
    `${API_BASE}/api/v1/auth/oauth/${provider}/authorize?redirect_uri=${encodeURIComponent(redirectUri)}`
  );

  if (!res.ok) {
    // [13]
    throw new Error("Failed to get authorization URL");
  }

  const data = await res.json(); // [14]
  redirect(data.url); // [15]
}
```

**Line-by-line:**

| Line   | Explanation                                                                                                                                                                                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]`  | `"use server"` — Marks this file as containing Server Actions. All exported async functions become callable from client components via RPC.                                                                                                                          |
| `[2]`  | Import Next.js `cookies()` to read/write httpOnly cookies server-side.                                                                                                                                                                                               |
| `[3]`  | Import `redirect()` — throws a special exception that Next.js catches to send a 307 redirect to the browser.                                                                                                                                                         |
| `[4]`  | Backend API base URL. In development: `http://localhost:8000`.                                                                                                                                                                                                       |
| `[5]`  | Frontend URL used to construct the OAuth callback URI.                                                                                                                                                                                                               |
| `[6]`  | The main login function. Exported as a Server Action — the client calls this via `signInWithOAuth("google")`.                                                                                                                                                        |
| `[7]`  | `provider` — Which OAuth provider to authenticate with. Currently supports `"google"` and `"kakao"`.                                                                                                                                                                 |
| `[8]`  | `callbackUrl` — Where to redirect the user after successful login. Defaults to `"/"` (home page).                                                                                                                                                                    |
| `[9]`  | Get the cookie store. In Next.js 16, `cookies()` is async.                                                                                                                                                                                                           |
| `[10]` | Save `callbackUrl` to a temporary cookie. We can't pass it through the OAuth redirect chain because Google Console requires exact redirect URI matches. The cookie is read later in Phase 3. `maxAge: 600` = 10 minutes (more than enough for the OAuth round-trip). |
| `[11]` | Build the OAuth callback URI. After the user consents, the OAuth provider redirects back to this URL. Example: `http://localhost:3000/api/auth/callback/google`.                                                                                                     |
| `[12]` | Call the backend's `/authorize` endpoint. This doesn't actually start OAuth — it just generates the authorization URL with proper parameters (client_id, scope, state, redirect_uri).                                                                                |
| `[13]` | If the backend can't generate the URL (e.g., unsupported provider), throw an error.                                                                                                                                                                                  |
| `[14]` | Parse the response: `{ url: "https://accounts.google.com/o/oauth2/v2/auth?...", state: "random-csrf-token" }`.                                                                                                                                                       |
| `[15]` | Redirect the user's browser to the OAuth provider's consent page. Next.js `redirect()` throws internally to trigger the navigation.                                                                                                                                  |

---

## Phase 2: Backend Generates Authorization URL

> **Flow**: FastAPI Controller → OAuth Module → Return URL to Frontend

When the frontend calls `GET /api/v1/auth/oauth/{provider}/authorize`, the backend generates the OAuth authorization URL.

### File: `server/app/api/v1/auth/controller.py` — `get_oauth_authorize_url()`

```python
@router.get(                                                            # [1]
    "/oauth/{provider}/authorize",
    response_model=AuthUrlResponse,                                     # [2]
)
async def get_oauth_authorize_url(                                      # [3]
    provider: str,                                                      # [4]
    redirect_uri: str = Query(..., description="Frontend callback URL"),# [5]
):
    try:
        get_provider_config(provider)                                   # [6]
        logger.debug(f"redirect_uri: {redirect_uri}")
    except ValueError:
        raise HTTPException(                                            # [7]
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider: {provider}",
        )

    state = secrets.token_urlsafe(32)                                   # [8]
    url = get_authorization_url(provider, redirect_uri, state)          # [9]

    return AuthUrlResponse(url=url, state=state)                        # [10]
```

**Line-by-line:**

| Line   | Explanation                                                                                                                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]`  | Register a `GET` endpoint at `/api/v1/auth/oauth/{provider}/authorize`. The `{provider}` is a path parameter (e.g., `google`, `kakao`).                                                       |
| `[2]`  | Response schema: `AuthUrlResponse` has `url: str` and `state: str` fields.                                                                                                                    |
| `[3]`  | Async endpoint handler — no authentication required (user isn't logged in yet).                                                                                                               |
| `[4]`  | `provider` is extracted from the URL path (e.g., `"google"`).                                                                                                                                 |
| `[5]`  | `redirect_uri` is a required query parameter. The frontend passes its callback URL (e.g., `http://localhost:3000/api/auth/callback/google`). The `...` means it's required (no default).      |
| `[6]`  | Validate the provider is supported by looking it up in `OAUTH_PROVIDERS` dict. This raises `ValueError` if not found.                                                                         |
| `[7]`  | Return 400 if the provider is unsupported (e.g., `"facebook"`).                                                                                                                               |
| `[8]`  | Generate a random CSRF protection `state` parameter (32 bytes, URL-safe base64). The OAuth provider will echo this back in the callback, and the frontend can verify it wasn't tampered with. |
| `[9]`  | Call `get_authorization_url()` from `oauth.py` to build the full OAuth URL.                                                                                                                   |
| `[10]` | Return the URL and state to the frontend. The frontend uses the URL to redirect the user.                                                                                                     |

### File: `server/app/api/v1/auth/oauth.py` — Provider Configuration & URL Generation

```python
OAUTH_PROVIDERS: dict[str, dict] = {                                    # [1]
    "google": {
        "client_id": settings.GOOGLE_CLIENT_ID,                         # [2]
        "client_secret": settings.GOOGLE_CLIENT_SECRET,                 # [3]
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",# [4]
        "token_url": "https://oauth2.googleapis.com/token",             # [5]
        "userinfo_url": "https://www.googleapis.com/oauth2/v3/userinfo",# [6]
        "scope": "openid email profile",                                # [7]
    },
    "kakao": {
        "client_id": settings.KAKAO_CLIENT_ID,
        "client_secret": settings.KAKAO_CLIENT_SECRET,
        "authorize_url": "https://kauth.kakao.com/oauth/authorize",
        "token_url": "https://kauth.kakao.com/oauth/token",
        "userinfo_url": "https://kapi.kakao.com/v2/user/me",
        "scope": "profile_nickname profile_image account_email",
    },
}
```

| Line  | Explanation                                                                                                                       |
| ----- | --------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Dictionary mapping provider names to their OAuth configuration.                                                                   |
| `[2]` | `client_id` — The app's public identifier registered with the OAuth provider. Loaded from environment variables.                  |
| `[3]` | `client_secret` — The app's secret key. Used server-side only (never exposed to the browser).                                     |
| `[4]` | `authorize_url` — The provider's authorization endpoint. Users are redirected here to grant consent.                              |
| `[5]` | `token_url` — The provider's token endpoint. The backend sends the authorization code here to get an access token.                |
| `[6]` | `userinfo_url` — The provider's resource server endpoint. Returns the user's profile (name, email, picture).                      |
| `[7]` | `scope` — Permissions requested from the user. Google: OpenID Connect + email + profile. Kakao: nickname + profile image + email. |

```python
def create_oauth_client(provider: str, redirect_uri: str) -> AsyncOAuth2Client: # [1]
    config = get_provider_config(provider)                              # [2]
    return AsyncOAuth2Client(                                           # [3]
        client_id=config["client_id"],
        client_secret=config["client_secret"],
        redirect_uri=redirect_uri,
        scope=config["scope"],
    )
```

| Line  | Explanation                                                                                                                                   |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Factory function that creates an Authlib `AsyncOAuth2Client` instance.                                                                        |
| `[2]` | Look up the provider's config from the `OAUTH_PROVIDERS` dict.                                                                                |
| `[3]` | Create the client with credentials and redirect URI. Authlib handles all OAuth 2.0 protocol details (PKCE, state management, token exchange). |

```python
def get_authorization_url(provider: str, redirect_uri: str, state: str) -> str: # [1]
    config = get_provider_config(provider)                              # [2]
    client = create_oauth_client(provider, redirect_uri)                # [3]
    url, _ = client.create_authorization_url(                           # [4]
        config["authorize_url"],
        state=state,
    )
    return url                                                          # [5]
```

| Line  | Explanation                                                                                                                                                                                                                               |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Generate the full OAuth authorization URL.                                                                                                                                                                                                |
| `[2]` | Get provider config (Google or Kakao).                                                                                                                                                                                                    |
| `[3]` | Create an OAuth2 client instance with the redirect URI.                                                                                                                                                                                   |
| `[4]` | `create_authorization_url()` builds the URL with all required parameters: `client_id`, `redirect_uri`, `scope`, `state`, `response_type=code`. Returns a tuple of `(url, state)` — we already have state, so we discard the second value. |
| `[5]` | Return the URL. Example: `https://accounts.google.com/o/oauth2/v2/auth?client_id=xxx&redirect_uri=http://localhost:3000/api/auth/callback/google&scope=openid+email+profile&state=random-token&response_type=code`                        |

---

## Phase 3: User Consents → Provider Redirects Back with Code

> **Flow**: OAuth Provider → Browser → Next.js API Route Handler

After the user clicks "Allow" on Google/Kakao's consent screen, the provider redirects the user's browser back to the frontend callback URL with an authorization code:

```
GET /api/auth/callback/google?code=4/0AY0e-g5T...&state=random-csrf-token
```

### File: `client/app/api/auth/callback/[provider]/route.ts`

```typescript
const API_BASE = process.env.API_URL || "http://localhost:8000"; // [1]
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // [2]
const ACCESS_COOKIE = // [3]
  process.env.NODE_ENV === "production" ? "__Secure-grapoll-access-token" : "grapoll-access-token";
const REFRESH_COOKIE = // [4]
  process.env.NODE_ENV === "production"
    ? "__Secure-grapoll-refresh-token"
    : "grapoll-refresh-token";
```

| Line  | Explanation                                                                                                      |
| ----- | ---------------------------------------------------------------------------------------------------------------- |
| `[1]` | Backend URL for API calls.                                                                                       |
| `[2]` | Frontend URL for constructing redirect responses.                                                                |
| `[3]` | Access token cookie name. In production, uses `__Secure-` prefix which browsers enforce to only send over HTTPS. |
| `[4]` | Refresh token cookie name. Same `__Secure-` prefix in production.                                                |

```typescript
export async function GET( // [1]
  request: NextRequest, // [2]
  { params }: { params: Promise<{ provider: string }> } // [3]
) {
  const { provider } = await params; // [4]
  const searchParams = request.nextUrl.searchParams; // [5]

  const code = searchParams.get("code"); // [6]
  const state = searchParams.get("state"); // [7]

  const callbackUrl = request.cookies.get("auth-callback-url")?.value || "/"; // [8]

  if (!code) {
    // [9]
    return NextResponse.redirect(new URL("/auth/signin?error=no_code", FRONTEND_URL));
  }

  const redirectUri = `${FRONTEND_URL}/api/auth/callback/${provider}`; // [10]

  try {
    const res = await fetch(
      // [11]
      `${API_BASE}/api/v1/auth/oauth/${provider}/callback`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code, // [12]
          state, // [13]
          redirect_uri: redirectUri, // [14]
        }),
      }
    );

    if (!res.ok) {
      // [15]
      return NextResponse.redirect(new URL("/auth/signin?error=auth_failed", FRONTEND_URL));
    }

    const data = await res.json(); // [16]

    const response = NextResponse.redirect(new URL(callbackUrl, FRONTEND_URL)); // [17]
    response.cookies.delete("auth-callback-url"); // [18]

    response.cookies.set(ACCESS_COOKIE, data.access_token, {
      // [19]
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60, // [20]
    });

    response.cookies.set(REFRESH_COOKIE, data.refresh_token, {
      // [21]
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // [22]
    });

    return response; // [23]
  } catch {
    return NextResponse.redirect(
      // [24]
      new URL("/auth/signin?error=server_error", FRONTEND_URL)
    );
  }
}
```

**Line-by-line:**

| Line   | Explanation                                                                                                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]`  | This is a Next.js API Route Handler. `GET` means it handles `GET /api/auth/callback/[provider]`.                                                                                         |
| `[2]`  | `NextRequest` provides access to cookies, URL, headers, etc.                                                                                                                             |
| `[3]`  | Dynamic route params — `[provider]` in the folder name becomes `params.provider`. In Next.js 16, params is a Promise.                                                                    |
| `[4]`  | Await and destructure the provider name (e.g., `"google"`).                                                                                                                              |
| `[5]`  | Get the query string parameters from the redirect URL.                                                                                                                                   |
| `[6]`  | Extract the `code` parameter — the authorization code from the OAuth provider. This is the one-time-use code that can be exchanged for tokens.                                           |
| `[7]`  | Extract the `state` parameter — should match what was sent in Phase 1 (CSRF protection).                                                                                                 |
| `[8]`  | Read the callback URL from the cookie we set in Phase 1. This is where the user was before they clicked login (e.g., `/polls/123`).                                                      |
| `[9]`  | If no code is present, the OAuth flow failed (user denied consent or something went wrong). Redirect to sign-in page with error.                                                         |
| `[10]` | Reconstruct the redirect URI. It must exactly match what was passed to the provider in Phase 1, otherwise the token exchange will fail.                                                  |
| `[11]` | Send the authorization code to the backend's callback endpoint via POST. The backend will exchange this code for tokens, fetch the user profile, and create/find the user.               |
| `[12]` | `code` — The one-time authorization code from the OAuth provider.                                                                                                                        |
| `[13]` | `state` — CSRF token for verification (currently validated implicitly by the OAuth library).                                                                                             |
| `[14]` | `redirect_uri` — Must match exactly. The backend passes this to the OAuth provider when exchanging the code for tokens.                                                                  |
| `[15]` | If the backend returns an error (invalid code, expired code, provider error), redirect to sign-in with error message.                                                                    |
| `[16]` | Parse the successful response: `{ access_token: "eyJ...", refresh_token: "eyJ...", token_type: "Bearer", user: { id, email, name, image, role } }`.                                      |
| `[17]` | Create a redirect response to send the user back to where they were before login (e.g., `/` or `/polls/123`).                                                                            |
| `[18]` | Delete the temporary `auth-callback-url` cookie — no longer needed.                                                                                                                      |
| `[19]` | Store the **access token** as an httpOnly cookie. `httpOnly: true` prevents JavaScript from reading it (XSS protection). `sameSite: "lax"` prevents CSRF while allowing OAuth redirects. |
| `[20]` | Access token cookie expires in 30 minutes (matches the JWT's expiration).                                                                                                                |
| `[21]` | Store the **refresh token** as an httpOnly cookie. Same security settings.                                                                                                               |
| `[22]` | Refresh token cookie expires in 30 days (matches the JWT's expiration).                                                                                                                  |
| `[23]` | Return the redirect response. The browser will receive this with `Set-Cookie` headers for both tokens, then navigate to the callback URL.                                                |
| `[24]` | If any network error occurs (backend unreachable), redirect to sign-in with error.                                                                                                       |

---

## Phase 4: Backend Exchanges Code for OAuth Tokens

> **Flow**: FastAPI Controller → Auth Service → OAuth Module → OAuth Provider

When the frontend sends `POST /api/v1/auth/oauth/{provider}/callback`, the backend handles the entire authentication flow.

### File: `server/app/api/v1/auth/controller.py` — `oauth_callback()`

```python
@router.post(                                                          # [1]
    "/oauth/{provider}/callback",
    response_model=AuthResponse,                                        # [2]
)
async def oauth_callback(                                               # [3]
    provider: str,                                                      # [4]
    body: OAuthCallbackRequest,                                         # [5]
    db: AsyncSession = Depends(get_db),                                 # [6]
):
    try:
        get_provider_config(provider)                                   # [7]
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider: {provider}",
        )

    try:
        result = await authenticate_oauth(                              # [8]
            db, provider, body.code, body.redirect_uri
        )
    except Exception as e:
        logger.error(                                                   # [9]
            f"OAuth authentication failed for {provider}: {e}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="OAuth authentication failed. Please try again.",
        )

    return AuthResponse(**result)                                       # [10]
```

| Line   | Explanation                                                                                                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `[1]`  | POST endpoint at `/api/v1/auth/oauth/{provider}/callback`.                                                                                                                       |
| `[2]`  | Response schema: `{ access_token, refresh_token, token_type, user }`.                                                                                                            |
| `[3]`  | Async handler — needs DB access for user creation.                                                                                                                               |
| `[4]`  | Provider from URL path (e.g., `"google"`).                                                                                                                                       |
| `[5]`  | Request body validated by Pydantic: `{ code: str, state: str                                                                                                                     | None, redirect_uri: str }`. |
| `[6]`  | Inject database session via FastAPI dependency injection. `get_db` yields an `AsyncSession` and handles cleanup.                                                                 |
| `[7]`  | Validate provider is supported.                                                                                                                                                  |
| `[8]`  | Call the auth service's `authenticate_oauth()` — this is the main orchestration function that handles everything: code exchange, profile fetch, user creation, and JWT issuance. |
| `[9]`  | Log the full exception with stack trace (`exc_info=True`) for debugging OAuth failures.                                                                                          |
| `[10]` | Return the result as an `AuthResponse` — the frontend receives `{ access_token, refresh_token, token_type, user }`.                                                              |

### File: `server/app/api/v1/auth/dto/schemas.py` — Request/Response Models

```python
class OAuthCallbackRequest(BaseModel):                                  # [1]
    code: str                                                           # [2]
    state: str | None = None                                            # [3]
    redirect_uri: str                                                   # [4]

class AuthResponse(BaseModel):                                          # [5]
    access_token: str                                                   # [6]
    refresh_token: str                                                  # [7]
    token_type: str = "Bearer"                                          # [8]
    user: dict                                                          # [9]
```

| Line  | Explanation                                                                                                                |
| ----- | -------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Pydantic model for the callback request body. FastAPI automatically validates and parses the JSON body against this model. |
| `[2]` | `code` — The authorization code from the OAuth provider. Required.                                                         |
| `[3]` | `state` — The CSRF protection state. Optional (the provider may not always return it).                                     |
| `[4]` | `redirect_uri` — Must match the URI used in Phase 1. The OAuth provider requires this for token exchange.                  |
| `[5]` | Response model for successful authentication.                                                                              |
| `[6]` | Our access JWT (30 min lifetime).                                                                                          |
| `[7]` | Our refresh JWT (30 days lifetime).                                                                                        |
| `[8]` | Standard OAuth token type — always `"Bearer"`.                                                                             |
| `[9]` | User profile data: `{ id, email, name, image, role }`.                                                                     |

### File: `server/app/api/v1/auth/service.py` — `authenticate_oauth()`

```python
async def authenticate_oauth(                                           # [1]
    db: AsyncSession,                                                   # [2]
    provider: str,
    code: str,
    redirect_uri: str,
) -> dict:
    # Step 1: Exchange code for OAuth tokens
    oauth_tokens = await exchange_code_for_token(                       # [3]
        provider, code, redirect_uri
    )

    # Step 2: Fetch user profile from resource server
    profile = await fetch_user_profile(                                 # [4]
        provider, oauth_tokens["access_token"]
    )

    # Step 3: Find or create user
    user = await get_or_create_user(                                    # [5]
        db, provider, profile, oauth_tokens
    )

    # Step 4: Issue our own tokens (both are stateless JWTs)
    access_token = create_access_token(                                 # [6]
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
    )
    refresh_token = create_refresh_token(                               # [7]
        user_id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
    )

    return {                                                            # [8]
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "Bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "image": user.image,
            "role": user.role,
        },
    }
```

| Line  | Explanation                                                                                                                                                                                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Main orchestration function for the OAuth flow. Takes DB session, provider, authorization code, and redirect URI.                                                                                           |
| `[2]` | `AsyncSession` — SQLAlchemy async database session for user CRUD operations.                                                                                                                                |
| `[3]` | **Step 1**: Exchange the authorization code for OAuth provider tokens. Calls `oauth.py:exchange_code_for_token()`. Returns `{ access_token, refresh_token, expires_at, id_token, ... }` from the provider.  |
| `[4]` | **Step 2**: Use the provider's access token to fetch the user's profile from the resource server (Google userinfo API or Kakao user API). Returns normalized `{ provider_account_id, email, name, image }`. |
| `[5]` | **Step 3**: Look up or create the user in our database. Handles account linking (same email = same user across providers).                                                                                  |
| `[6]` | **Step 4a**: Create a **short-lived access JWT** (30 min). Contains `{ sub, email, name, role, type: "access" }`. This is our own JWT — not the OAuth provider's token.                                     |
| `[7]` | **Step 4b**: Create a **long-lived refresh JWT** (30 days). Contains `{ sub, email, name, role, type: "refresh" }`. Same claims as access token but with longer expiry and different type.                  |
| `[8]` | Return everything to the controller, which returns it to the frontend.                                                                                                                                      |

### File: `server/app/api/v1/auth/oauth.py` — Token Exchange & Profile Fetch

```python
async def exchange_code_for_token(                                      # [1]
    provider: str, code: str, redirect_uri: str
) -> dict:
    config = get_provider_config(provider)                              # [2]
    client = create_oauth_client(provider, redirect_uri)                # [3]

    token = await client.fetch_token(                                   # [4]
        config["token_url"],                                            # [5]
        code=code,                                                      # [6]
    )
    return dict(token)                                                  # [7]
```

| Line  | Explanation                                                                                                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Exchange an authorization code for an OAuth access token. This is the core of the Authorization Code Grant.                                                                            |
| `[2]` | Get the provider's configuration (client_id, client_secret, token_url, etc.).                                                                                                          |
| `[3]` | Create an Authlib OAuth2 client with the same redirect_uri used in Phase 1 (must match exactly).                                                                                       |
| `[4]` | `fetch_token()` — Authlib sends a POST request to the provider's token endpoint with `grant_type=authorization_code`, `code`, `client_id`, `client_secret`, and `redirect_uri`.        |
| `[5]` | Token endpoint URL. Google: `https://oauth2.googleapis.com/token`. Kakao: `https://kauth.kakao.com/oauth/token`.                                                                       |
| `[6]` | The one-time authorization code received from the provider's redirect.                                                                                                                 |
| `[7]` | Convert the token response to a plain dict. Contains: `{ access_token, refresh_token, expires_at, id_token, token_type, scope }`. These are the **OAuth provider's tokens**, not ours. |

```python
async def fetch_user_profile(                                           # [1]
    provider: str, access_token: str
) -> dict:
    config = get_provider_config(provider)                              # [2]

    async with AsyncOAuth2Client(                                       # [3]
        token={"access_token": access_token, "token_type": "Bearer"}
    ) as client:
        resp = await client.get(config["userinfo_url"])                 # [4]
        resp.raise_for_status()                                         # [5]
        data = resp.json()                                              # [6]

    if provider == "google":                                            # [7]
        return {
            "provider_account_id": data["sub"],                         # [8]
            "email": data.get("email"),
            "name": data.get("name"),
            "image": data.get("picture"),
        }
    elif provider == "kakao":                                           # [9]
        account = data.get("kakao_account", {})
        profile = account.get("profile", {})
        return {
            "provider_account_id": str(data["id"]),                     # [10]
            "email": account.get("email"),
            "name": profile.get("nickname"),
            "image": profile.get("profile_image_url"),
        }
```

| Line   | Explanation                                                                                                                                                 |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]`  | Fetch the authenticated user's profile from the OAuth provider's resource server.                                                                           |
| `[2]`  | Get provider config for the userinfo URL.                                                                                                                   |
| `[3]`  | Create an Authlib client pre-configured with the OAuth access token (from the provider, not ours). `async with` ensures the HTTP client is properly closed. |
| `[4]`  | Send GET request to the userinfo endpoint. Google: `https://www.googleapis.com/oauth2/v3/userinfo`. Kakao: `https://kapi.kakao.com/v2/user/me`.             |
| `[5]`  | Raise exception if the request failed (e.g., token revoked).                                                                                                |
| `[6]`  | Parse the JSON response — raw user profile data.                                                                                                            |
| `[7]`  | **Google profile normalization**: Google returns a flat object.                                                                                             |
| `[8]`  | `data["sub"]` — Google's unique user ID (e.g., `"117..."` numeric string). Used as `provider_account_id` to link this Google account to our user.           |
| `[9]`  | **Kakao profile normalization**: Kakao nests data inside `kakao_account.profile`.                                                                           |
| `[10]` | `data["id"]` — Kakao's unique user ID (integer, converted to string).                                                                                       |

---

## Phase 5: User Creation / Lookup in Database

> **Flow**: Auth Service → Database (SQLAlchemy) → User & Account Models

### File: `server/app/api/v1/auth/service.py` — `get_or_create_user()`

```python
async def get_or_create_user(                                           # [1]
    db: AsyncSession,
    provider: str,
    profile: dict,
    oauth_tokens: dict,
) -> User:
    provider_account_id = profile["provider_account_id"]                # [2]

    # Check if this OAuth account is already linked to a user
    result = await db.execute(                                          # [3]
        select(User)
        .join(Account, Account.user_id == User.id)                      # [4]
        .where(Account.provider == provider)                            # [5]
        .where(Account.provider_account_id == provider_account_id)
    )
    user = result.scalar_one_or_none()                                  # [6]

    if user:                                                            # [7]
        # Update OAuth tokens on the account
        account_result = await db.execute(                              # [8]
            select(Account)
            .where(Account.provider == provider)
            .where(Account.provider_account_id == provider_account_id)
        )
        account = account_result.scalar_one()
        account.access_token = oauth_tokens.get("access_token")         # [9]
        account.refresh_token = oauth_tokens.get("refresh_token")
        account.expires_at = oauth_tokens.get("expires_at")
        account.id_token = oauth_tokens.get("id_token")
        await db.commit()                                               # [10]
        return user
```

| Line   | Explanation                                                                                                                                                    |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]`  | Find an existing user or create a new one based on the OAuth profile.                                                                                          |
| `[2]`  | Extract the unique provider account ID (e.g., Google's `sub` or Kakao's `id`).                                                                                 |
| `[3]`  | Query: "Is there a user with an account linked to this provider + account ID?"                                                                                 |
| `[4]`  | JOIN `users` with `accounts` on `user_id`.                                                                                                                     |
| `[5]`  | Filter by provider name AND provider account ID. This uniquely identifies one OAuth account.                                                                   |
| `[6]`  | `scalar_one_or_none()` — Returns the User if found, `None` if no match.                                                                                        |
| `[7]`  | **Existing user found** — This person has logged in with this provider before.                                                                                 |
| `[8]`  | Look up the Account record to update the OAuth tokens.                                                                                                         |
| `[9]`  | Update the stored OAuth tokens (the provider issues new tokens each login). These are the **provider's** tokens (for API calls to Google/Kakao), not our JWTs. |
| `[10]` | Commit the token update to the database.                                                                                                                       |

```python
    # Check if a user with this email already exists (link account)
    if profile.get("email"):                                            # [1]
        result = await db.execute(
            select(User).where(User.email == profile["email"])
        )
        user = result.scalar_one_or_none()

    if user:                                                            # [2]
        logger.info(f"Linking new OAuth account to existing user: {user.id}")
    else:
        # Create new user
        from cuid2 import cuid_wrapper                                  # [3]
        generate_cuid = cuid_wrapper()
        user = User(                                                    # [4]
            id=generate_cuid(),                                         # [5]
            name=profile.get("name"),
            email=profile.get("email"),
            image=profile.get("image"),
            role=Role.USER,                                             # [6]
        )
        db.add(user)                                                    # [7]
        await db.flush()                                                # [8]

    # Link OAuth account
    from cuid2 import cuid_wrapper
    generate_cuid = cuid_wrapper()
    account = Account(                                                  # [9]
        id=generate_cuid(),
        user_id=user.id,
        type="oauth",
        provider=provider,
        provider_account_id=provider_account_id,
        access_token=oauth_tokens.get("access_token"),
        refresh_token=oauth_tokens.get("refresh_token"),
        expires_at=oauth_tokens.get("expires_at"),
        token_type=oauth_tokens.get("token_type"),
        scope=oauth_tokens.get("scope"),
        id_token=oauth_tokens.get("id_token"),
    )
    db.add(account)                                                     # [10]
    await db.commit()                                                   # [11]

    return user
```

| Line   | Explanation                                                                                                                                                                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]`  | **Account linking**: If no OAuth account found, check if a user with the same email exists. This handles the case where a user first logged in with Google and then tries Kakao with the same email — they should be linked to the same user. |
| `[2]`  | If a user with the same email exists, we'll link the new OAuth account to them.                                                                                                                                                               |
| `[3]`  | Import CUID2 generator. CUIDs are collision-resistant unique IDs (compatible with Prisma's default ID format).                                                                                                                                |
| `[4]`  | Create a new User model instance with profile data from the OAuth provider.                                                                                                                                                                   |
| `[5]`  | Generate a CUID as the user's primary key (e.g., `"clx9ab2c3d0001..."`).                                                                                                                                                                      |
| `[6]`  | Default role is `Role.USER`. The PostgreSQL column uses a custom enum type `"Role"` created by Prisma.                                                                                                                                        |
| `[7]`  | Add the user to the session (marks for INSERT).                                                                                                                                                                                               |
| `[8]`  | `flush()` — Execute the INSERT immediately (generates the row in DB) but don't commit yet. This ensures `user.id` is available for the Account foreign key.                                                                                   |
| `[9]`  | Create a new Account record linking this OAuth provider to the user. Stores the provider's tokens for future API calls.                                                                                                                       |
| `[10]` | Add the account to the session.                                                                                                                                                                                                               |
| `[11]` | Commit both the user and account to the database in a single transaction.                                                                                                                                                                     |

### Database Models Used

**File: `server/app/models/user.py`**

```python
class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(25), primary_key=True)       # CUID
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    image: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    role: Mapped[str] = mapped_column(
        SAEnum(Role, name="Role", create_type=False),                   # Matches PG enum type
        default=Role.USER,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), server_default=func.now(), onupdate=func.now()
    )
```

**File: `server/app/models/account.py`**

```python
class Account(Base):
    __tablename__ = "accounts"
    id: Mapped[str] = mapped_column(String(25), primary_key=True)       # CUID
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[str] = mapped_column(String(255))                      # "oauth"
    provider: Mapped[str] = mapped_column(String(255))                  # "google" | "kakao"
    provider_account_id: Mapped[str] = mapped_column(String(255))       # Provider's user ID
    access_token: Mapped[str | None] = mapped_column(Text)              # Provider's access token
    refresh_token: Mapped[str | None] = mapped_column(Text)             # Provider's refresh token
    # ... other OAuth token fields
```

---

## Phase 6: JWT Token Issuance

> **Flow**: Auth Service → JWT Module → Return Tokens

After the user is found/created, the backend issues its own JWT tokens.

### File: `server/app/api/v1/auth/jwt.py`

```python
def create_access_token(                                                # [1]
    user_id: str, email: str | None, name: str | None, role: str
) -> str:
    now = datetime.now(timezone.utc)                                    # [2]
    payload = {
        "sub": user_id,                                                 # [3]
        "email": email,                                                 # [4]
        "name": name,
        "role": role,
        "type": "access",                                               # [5]
        "iat": now,                                                     # [6]
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), # [7]
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM) # [8]
```

| Line  | Explanation                                                                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Create a short-lived access token JWT.                                                                                                                   |
| `[2]` | Current UTC time — used for `iat` (issued at) and computing `exp` (expiration).                                                                          |
| `[3]` | `sub` (subject) — Standard JWT claim for the user identifier. Contains the CUID user ID.                                                                 |
| `[4]` | User claims embedded in the token — no DB lookup needed to get user info from a token.                                                                   |
| `[5]` | `type: "access"` — Distinguishes this from a refresh token. The JWT guard (`jwt_guard.py`) checks this claim and rejects tokens with `type != "access"`. |
| `[6]` | `iat` — When the token was issued (standard JWT claim).                                                                                                  |
| `[7]` | `exp` — Expiration time. `ACCESS_TOKEN_EXPIRE_MINUTES` defaults to 30. After this time, PyJWT will raise `ExpiredSignatureError` when decoding.          |
| `[8]` | Encode the payload into a JWT string using HS256 and the server's secret key. Only the server can create/verify these tokens.                            |

```python
def create_refresh_token(                                               # [1]
    user_id: str, email: str | None, name: str | None, role: str
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "role": role,
        "type": "refresh",                                              # [2]
        "iat": now,
        "exp": now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),# [3]
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
```

| Line  | Explanation                                                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Create a long-lived refresh token JWT. Same structure as access token but different `type` and `exp`.                                                               |
| `[2]` | `type: "refresh"` — This token can only be used to create new access tokens. It cannot be used as an access token because `jwt_guard.py` checks `type == "access"`. |
| `[3]` | Expires in 30 days. During this window, the user doesn't need to re-login — their access token is automatically refreshed.                                          |

```python
def decode_refresh_token(token: str) -> dict:                           # [1]
    payload = jwt.decode(                                               # [2]
        token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
    )
    if payload.get("type") != "refresh":                                # [3]
        raise jwt.InvalidTokenError("Not a refresh token")
    return payload                                                      # [4]
```

| Line  | Explanation                                                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Decode and validate a refresh token. Used by the refresh middleware and explicit refresh endpoint.                                 |
| `[2]` | Decode the JWT. If expired, raises `ExpiredSignatureError`. If tampered, raises `InvalidTokenError`.                               |
| `[3]` | Type guard — ensures an access token can't be used as a refresh token. Raises `InvalidTokenError` if the type claim doesn't match. |
| `[4]` | Return the decoded payload: `{ sub, email, name, role, type, iat, exp }`.                                                          |

---

## Phase 7: Session Maintenance — Auto-Refresh Middleware

> **Flow**: Any Backend Request → TokenRefreshMiddleware → Route Handler

After login, the access token expires in 30 minutes. The **Token Refresh Middleware** transparently refreshes it using the refresh token, so the user never has to re-login (for up to 30 days).

### File: `server/app/api/v1/auth/refresh_middleware.py`

```python
SKIP_PREFIXES = (                                                       # [1]
    "/api/v1/auth/",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
)

ACCESS_COOKIE = "grapoll-access-token"                                  # [2]
ACCESS_COOKIE_SECURE = "__Secure-grapoll-access-token"
REFRESH_COOKIE = "grapoll-refresh-token"
REFRESH_COOKIE_SECURE = "__Secure-grapoll-refresh-token"
```

| Line  | Explanation                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------ |
| `[1]` | Paths that skip token refresh. Auth endpoints handle their own auth. Public endpoints (docs, health) don't need auth.          |
| `[2]` | Cookie names for both development and production variants. The middleware checks both because it doesn't know the environment. |

```python
class TokenRefreshMiddleware:                                           # [1]
    def __init__(self, app: ASGIApp) -> None:                           # [2]
        self.app = app

    async def __call__(                                                  # [3]
        self, scope: Scope, receive: Receive, send: Send
    ) -> None:
        if scope["type"] != "http":                                     # [4]
            await self.app(scope, receive, send)
            return

        path = scope["path"]                                            # [5]

        if self._should_skip(path):                                     # [6]
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))                        # [7]
        cookies = self._parse_cookies(headers)                          # [8]

        access_token = self._get_access_token(headers, cookies)         # [9]
        refresh_token = self._get_refresh_token(headers, cookies)       # [10]

        new_access_token = None                                         # [11]
```

| Line   | Explanation                                                                                                                                                                                                                                                                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]`  | **Pure ASGI middleware** — NOT `BaseHTTPMiddleware`. This is critical: Starlette's `BaseHTTPMiddleware` runs downstream handlers in a separate async task via `call_next()`, which breaks SQLAlchemy's async session greenlet context (causes `MissingGreenlet` / `f405` error). Pure ASGI avoids this by keeping everything in the same async context. |
| `[2]`  | `app` is the next ASGI application in the middleware chain.                                                                                                                                                                                                                                                                                             |
| `[3]`  | The ASGI interface: `scope` contains request info, `receive` reads the request body, `send` writes the response.                                                                                                                                                                                                                                        |
| `[4]`  | Only process HTTP requests — skip WebSocket and lifespan events.                                                                                                                                                                                                                                                                                        |
| `[5]`  | Extract the request path from the ASGI scope.                                                                                                                                                                                                                                                                                                           |
| `[6]`  | Skip auth endpoints, docs, and health check.                                                                                                                                                                                                                                                                                                            |
| `[7]`  | Convert headers from ASGI format (list of `(bytes, bytes)` tuples) to a dict.                                                                                                                                                                                                                                                                           |
| `[8]`  | Parse the `Cookie` header into a `{ name: value }` dict using Python's `SimpleCookie`.                                                                                                                                                                                                                                                                  |
| `[9]`  | Extract access token: first check `Authorization: Bearer` header, then check cookies.                                                                                                                                                                                                                                                                   |
| `[10]` | Extract refresh token: first check `X-Refresh-Token` header, then check cookies.                                                                                                                                                                                                                                                                        |
| `[11]` | Will hold the new access token if refresh succeeds.                                                                                                                                                                                                                                                                                                     |

```python
        if access_token:                                                # [1]
            try:
                payload = pyjwt.decode(                                 # [2]
                    access_token,
                    settings.JWT_SECRET,
                    algorithms=[settings.JWT_ALGORITHM],
                )
                if payload.get("type") == "access":                     # [3]
                    await self.app(scope, receive, send)                 # [4]
                    return
            except (pyjwt.ExpiredSignatureError,                        # [5]
                    pyjwt.InvalidTokenError):
                pass                                                    # [6]
```

| Line  | Explanation                                                                              |
| ----- | ---------------------------------------------------------------------------------------- |
| `[1]` | If there's an access token, try to validate it.                                          |
| `[2]` | Decode the JWT. Verifies signature and expiration.                                       |
| `[3]` | Check the `type` claim. This prevents refresh tokens from being used as access tokens.   |
| `[4]` | **Valid access token** — pass through to the route handler unchanged. No refresh needed. |
| `[5]` | If the token is expired or invalid, catch the exception...                               |
| `[6]` | ...and fall through to the refresh logic below.                                          |

```python
        # No valid access token — attempt refresh
        if refresh_token:                                               # [1]
            try:
                refresh_payload = decode_refresh_token(refresh_token)   # [2]
                new_access_token = create_access_token(                 # [3]
                    user_id=refresh_payload["sub"],
                    email=refresh_payload.get("email"),
                    name=refresh_payload.get("name"),
                    role=refresh_payload.get("role", "USER"),
                )
                scope["headers"] = self._replace_auth_header(           # [4]
                    scope["headers"], new_access_token
                )
            except (pyjwt.ExpiredSignatureError,                        # [5]
                    pyjwt.InvalidTokenError) as e:
                logger.debug("Refresh token invalid: %s", e)

        if not new_access_token:                                        # [6]
            await self.app(scope, receive, send)
            return
```

| Line  | Explanation                                                                                                                                                |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | If there's a refresh token, attempt to use it.                                                                                                             |
| `[2]` | Decode the refresh JWT. Validates signature, expiration, and `type == "refresh"`. **No database lookup** — fully stateless.                                |
| `[3]` | Create a new access token from the refresh token's claims. The new access token has fresh `iat` and `exp` times.                                           |
| `[4]` | **Inject the new access token into the request**. Replace the `Authorization` header in the ASGI scope so the downstream route handler sees a valid token. |
| `[5]` | If the refresh token is also expired or invalid, log it and move on.                                                                                       |
| `[6]` | If refresh failed (no refresh token or invalid), pass through — the JWT guard downstream will raise 401.                                                   |

```python
        # Wrap send to inject X-New-Access-Token into response headers
        token_to_inject = new_access_token                              # [1]

        async def send_with_token(message: Message) -> None:            # [2]
            if message["type"] == "http.response.start":                # [3]
                headers = list(message.get("headers", []))              # [4]
                headers.append(                                         # [5]
                    (b"x-new-access-token", token_to_inject.encode())
                )
                message["headers"] = headers                            # [6]
            await send(message)                                         # [7]

        await self.app(scope, receive, send_with_token)                 # [8]
```

| Line  | Explanation                                                                                                                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Capture the new token in a closure variable.                                                                                                                                                              |
| `[2]` | Create a wrapper function that intercepts the response.                                                                                                                                                   |
| `[3]` | ASGI sends the response in two messages: `http.response.start` (status + headers) and `http.response.body` (body). We only modify the first one.                                                          |
| `[4]` | Get the existing response headers as a mutable list.                                                                                                                                                      |
| `[5]` | Append our custom header `X-New-Access-Token` with the new JWT value.                                                                                                                                     |
| `[6]` | Replace the headers in the message.                                                                                                                                                                       |
| `[7]` | Forward the message to the original `send` function (sends to client).                                                                                                                                    |
| `[8]` | Call the downstream application with the modified request scope and our wrapped send function. The route handler processes the request with a valid access token, and the response gets our extra header. |

### Helper Methods

```python
def _get_access_token(self, headers, cookies) -> str | None:
    auth_header = headers.get(b"authorization", b"").decode()           # [1]
    if auth_header.startswith("Bearer "):                               # [2]
        return auth_header[7:]                                          # [3]
    for name in (ACCESS_COOKIE_SECURE, ACCESS_COOKIE):                  # [4]
        if name in cookies:
            return cookies[name]
    return None
```

| Line  | Explanation                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------------- |
| `[1]` | Read the `Authorization` header (priority source).                                                   |
| `[2]` | Check if it's a Bearer token.                                                                        |
| `[3]` | Extract the token value (skip `"Bearer "` prefix = 7 characters).                                    |
| `[4]` | Fallback: check cookies. Check `__Secure-` cookie first (production), then non-secure (development). |

```python
def _replace_auth_header(self, headers, new_token) -> list:
    new_headers = [                                                     # [1]
        (k, v) for k, v in headers if k.lower() != b"authorization"
    ]
    new_headers.append(                                                 # [2]
        (b"authorization", f"Bearer {new_token}".encode())
    )
    return new_headers
```

| Line  | Explanation                                                                                                                              |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Remove the old `Authorization` header (if any).                                                                                          |
| `[2]` | Add a new `Authorization: Bearer <new_token>` header. The downstream route handler will see this valid token instead of the expired one. |

---

## Phase 8: Frontend Handles Auto-Refreshed Tokens

> **Flow**: Backend Response → Frontend Token Update → Cookie Updated

When the backend refreshes a token, the response includes `X-New-Access-Token`. The frontend detects this and updates the cookie.

### File: `client/lib/auth/tokens.ts`

```typescript
export const ACCESS_COOKIE = // [1]
  process.env.NODE_ENV === "production" ? "__Secure-grapoll-access-token" : "grapoll-access-token";
export const REFRESH_COOKIE = // [2]
  process.env.NODE_ENV === "production"
    ? "__Secure-grapoll-refresh-token"
    : "grapoll-refresh-token";
```

| Line  | Explanation                                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Access token cookie name. Environment-aware: `__Secure-` prefix in production ensures browser only sends cookie over HTTPS. |
| `[2]` | Refresh token cookie name. Same pattern.                                                                                    |

```typescript
export async function getAccessToken(): Promise<string | null> {
  // [1]
  try {
    const cookieStore = await cookies(); // [2]
    return cookieStore.get(ACCESS_COOKIE)?.value ?? null; // [3]
  } catch {
    return null; // [4]
  }
}

export async function getRefreshToken(): Promise<string | null> {
  // [5]
  try {
    const cookieStore = await cookies();
    return cookieStore.get(REFRESH_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}
```

| Line  | Explanation                                                                                                                                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Read the access token from cookies. Server-side only — `cookies()` from `next/headers` only works in Server Components, Server Actions, and Route Handlers. |
| `[2]` | Get the cookie store (async in Next.js 16).                                                                                                                 |
| `[3]` | Read the cookie value. Returns `null` if not found.                                                                                                         |
| `[4]` | If `cookies()` throws (e.g., called from a context where cookies aren't available), return `null`.                                                          |
| `[5]` | Same pattern for refresh token.                                                                                                                             |

```typescript
export async function updateAccessTokenCookie(newToken: string): Promise<void> {
  // [1]
  try {
    const cookieStore = await cookies();
    cookieStore.set(ACCESS_COOKIE, newToken, {
      // [2]
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60, // [3]
    });
  } catch {
    // [4]
    // Server Components can't modify cookies — that's fine.
    // The backend middleware will refresh again on the next request.
  }
}
```

| Line  | Explanation                                                                                                                                                                                                                                                                                     |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Update the access token cookie with a new value from the backend's auto-refresh.                                                                                                                                                                                                                |
| `[2]` | Set the cookie with the same security settings as the original.                                                                                                                                                                                                                                 |
| `[3]` | Reset the `maxAge` to 30 minutes (fresh expiration for the new token).                                                                                                                                                                                                                          |
| `[4]` | **Critical**: `cookies().set()` throws in **Server Components** (only read-only access). This try/catch makes it silently fail, which is fine — the backend will refresh again on the next request. The cookie gets updated when this function is called from Server Actions or Route Handlers. |

```typescript
export async function handleTokenRefreshResponse(res: Response): Promise<void> {
  // [1]
  const newToken = res.headers.get("x-new-access-token"); // [2]
  if (newToken) {
    await updateAccessTokenCookie(newToken); // [3]
  }
}
```

| Line  | Explanation                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Check a backend response for an auto-refreshed token. Called after every backend API call.                           |
| `[2]` | Read the `X-New-Access-Token` response header. If the backend refreshed the token, this header contains the new JWT. |
| `[3]` | If a new token was provided, update the cookie.                                                                      |

```typescript
export async function buildAuthHeaders(): Promise<Record<string, string>> {
  // [1]
  const headers: Record<string, string> = {};
  const accessToken = await getAccessToken(); // [2]
  const refreshToken = await getRefreshToken(); // [3]

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`; // [4]
  }
  if (refreshToken) {
    headers["X-Refresh-Token"] = refreshToken; // [5]
  }
  return headers;
}
```

| Line  | Explanation                                                                                                            |
| ----- | ---------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Build headers for backend requests with both tokens.                                                                   |
| `[2]` | Read the access token from cookies.                                                                                    |
| `[3]` | Read the refresh token from cookies.                                                                                   |
| `[4]` | Add the access token as a standard Bearer auth header.                                                                 |
| `[5]` | Add the refresh token as a custom `X-Refresh-Token` header. The backend middleware reads this to perform auto-refresh. |

### How Each Frontend Layer Uses These Helpers

**1. Manual API Fetch (`lib/api.ts`)** — For poll endpoints:

```typescript
async function apiFetch<T>(path: string, options?: RequestInit) {
  const authHeaders = await buildAuthHeaders(); // Send both tokens
  const res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeaders } });
  await handleTokenRefreshResponse(res); // Update cookie if refreshed
  // ... parse response
}
```

**2. OpenAPI Client (`config/openapi-runtime.ts`)** — For post/comment endpoints:

```typescript
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  async auth() {
    return getCookie(AUTH_COOKIE_NAME, { cookies });
  }, // Access token via auth()
  async fetch(input, init) {
    const refreshToken = await getRefreshToken(); // Add refresh token
    if (refreshToken) {
      const headers = new Headers(init?.headers);
      headers.set("X-Refresh-Token", refreshToken);
      init = { ...init, headers };
    }
    const response = await globalThis.fetch(input, init);
    await handleTokenRefreshResponse(response); // Update cookie if refreshed
    return response;
  },
});
```

**3. Server-side Session (`lib/auth/session.ts`)** — For Server Components:

```typescript
export async function auth(): Promise<ServerSession | null> {
  const headers = await buildAuthHeaders(); // Both tokens
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, { headers });
  await handleTokenRefreshResponse(res); // Update cookie if refreshed
  // ... return session or null
}
```

**4. Server Actions HOF (`lib/auth/with-auth.ts`)** — For mutations:

```typescript
async function getServerSession(): Promise<AuthenticatedUser | null> {
  const headers = await buildAuthHeaders(); // Both tokens
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, { headers });
  await handleTokenRefreshResponse(res); // Update cookie if refreshed
  // ... return user or null
}
```

---

## Phase 9: JWT Guard — Route Protection

> **Flow**: Request → JWT Guard (FastAPI Dependency) → Route Handler or 401

Protected routes use FastAPI dependency injection to require valid authentication.

### File: `server/app/api/v1/auth/jwt_guard.py`

```python
@dataclass
class JWTPayload:                                                       # [1]
    user_id: str
    email: str | None
    name: str | None
    role: str
    exp: int | None = None
    iat: int | None = None

    @classmethod
    def from_dict(cls, data: dict) -> "JWTPayload":                     # [2]
        user_id = data.get("id", data.get("sub", ""))                   # [3]
        if not user_id:
            raise InvalidTokenError(...)
        return cls(
            user_id=user_id,
            email=data.get("email"),
            name=data.get("name"),
            role=data.get("role", "USER"),
            exp=data.get("exp"),
            iat=data.get("iat"),
        )
```

| Line  | Explanation                                                                                   |
| ----- | --------------------------------------------------------------------------------------------- |
| `[1]` | Structured representation of a decoded JWT payload. Provides type-safe access to user claims. |
| `[2]` | Factory method to create a `JWTPayload` from a raw JWT dictionary.                            |
| `[3]` | Try `id` first, then `sub`. Our tokens use `sub` (standard JWT claim).                        |

```python
async def get_current_user(                                             # [1]
    request: Request,
    token_from_header: Annotated[str | None, Depends(get_token_from_header)],
) -> JWTPayload:
    token_from_cookie = await get_token_from_cookie(request)            # [2]
    token = token_from_header or token_from_cookie                      # [3]

    if not token:                                                       # [4]
        raise HTTPException(status_code=401, detail="Not authenticated.")

    try:
        payload = decode_token(token)                                   # [5]
        if payload.get("type") != "access":                             # [6]
            raise HTTPException(status_code=401, detail="Invalid token type.")
        return JWTPayload.from_dict(payload)                            # [7]
    except pyjwt.ExpiredSignatureError:                                 # [8]
        raise HTTPException(status_code=401, detail="Token has expired.")
    except pyjwt.InvalidTokenError:                                     # [9]
        raise HTTPException(status_code=401, detail="Invalid token.")
```

| Line  | Explanation                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------- |
| `[1]` | FastAPI dependency function — used as `current_user: CurrentUser` in route handlers.                      |
| `[2]` | Check cookies as fallback (cookies are sent automatically by the browser).                                |
| `[3]` | Prefer header over cookie (header is set by the middleware with the refreshed token).                     |
| `[4]` | No token at all → 401 Unauthorized.                                                                       |
| `[5]` | Decode and verify the JWT signature and expiration.                                                       |
| `[6]` | **Type check** — rejects refresh tokens used as access tokens. Only `type: "access"` tokens are accepted. |
| `[7]` | Return the structured payload. Route handlers access `current_user.user_id`, `current_user.email`, etc.   |
| `[8]` | Token expired (shouldn't happen if middleware refreshed it, but handles edge cases).                      |
| `[9]` | Token tampered with or malformed.                                                                         |

**Usage in routes:**

```python
# Type alias for clean dependency injection
CurrentUser = Annotated[JWTPayload, Depends(get_current_user)]

# Example route
@router.get("/me")
async def get_me(current_user: CurrentUser):       # Automatically authenticated
    return UserResponse(id=current_user.user_id, ...)
```

---

## Phase 10: Client-Side Session Check

> **Flow**: Browser → Next.js Route Handler → FastAPI Backend → Auth Context

The browser checks if the user is authenticated on initial page load.

### File: `client/lib/auth/auth-context.tsx`

```typescript
"use client";                                                           // [1]

interface AuthUser {                                                    // [2]
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: string;
}

async function fetchAuthUser(): Promise<AuthUser | null> {              // [3]
  try {
    const res = await fetch("/api/auth/me");                            // [4]
    if (res.ok) {
      return await res.json();                                          // [5]
    }
    return null;                                                        // [6]
  } catch {
    return null;
  }
}

let authPromise: Promise<AuthUser | null> | null = null;                // [7]

function getAuthPromise() {                                             // [8]
  if (!authPromise) {
    authPromise = fetchAuthUser();
  }
  return authPromise;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialUser = use(getAuthPromise());                            // [9]

  const [user, setUser] = useState<AuthUser | null>(initialUser);       // [10]
  const [status, setStatus] = useState<AuthStatus>(                     // [11]
    initialUser ? "authenticated" : "unauthenticated"
  );

  const refreshAuth = useCallback(() => {                               // [12]
    authPromise = null;
    fetchAuthUser().then((data) => {
      setUser(data);
      setStatus(data ? "authenticated" : "unauthenticated");
    });
  }, []);

  const logout = useCallback(async () => {                              // [13]
    try {
      await fetch("/api/auth/logout", { method: "POST" });             // [14]
    } catch { /* Ignore errors */ }
    setUser(null);                                                      // [15]
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(                                                // [16]
    () => ({ user, status, refreshAuth, logout }),
    [user, status, refreshAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; // [17]
}
```

| Line   | Explanation                                                                                                                                               |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]`  | Client component — runs in the browser. Uses React hooks and browser APIs.                                                                                |
| `[2]`  | User data shape matching the backend's `UserResponse`.                                                                                                    |
| `[3]`  | Fetch the current user from the Next.js API route (not directly from FastAPI).                                                                            |
| `[4]`  | Call `GET /api/auth/me` — the Next.js Route Handler that proxies to the backend. Cookies are sent automatically by the browser.                           |
| `[5]`  | Parse user data if authenticated.                                                                                                                         |
| `[6]`  | Return `null` if not authenticated (401 response).                                                                                                        |
| `[7]`  | Singleton promise — ensures `fetchAuthUser()` is called only once, even if `AuthProvider` re-renders.                                                     |
| `[8]`  | Lazy initialization: creates the fetch promise on first access.                                                                                           |
| `[9]`  | `use()` — React 19 hook that suspends the component while the promise is pending. This enables showing a loading state via a Suspense boundary.           |
| `[10]` | Store the user in state. Updated by `refreshAuth()` and `logout()`.                                                                                       |
| `[11]` | Track auth status: `"loading"`, `"authenticated"`, or `"unauthenticated"`.                                                                                |
| `[12]` | `refreshAuth()` — Re-check authentication status. Called after actions that might change auth state. Resets the singleton promise and fetches fresh data. |
| `[13]` | `logout()` — Sign out the user.                                                                                                                           |
| `[14]` | Call the Next.js logout route, which clears cookies and tells the backend.                                                                                |
| `[15]` | Clear user state immediately (optimistic UI update).                                                                                                      |
| `[16]` | Memoize the context value to prevent unnecessary re-renders.                                                                                              |
| `[17]` | Provide auth state to the entire component tree via React Context.                                                                                        |

### File: `client/app/api/auth/me/route.ts` — Session Check Proxy

```typescript
export async function GET() {
  // [1]
  const headers = await buildAuthHeaders(); // [2]

  if (!headers["Authorization"] && !headers["X-Refresh-Token"]) {
    // [3]
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, { headers }); // [4]
    const newToken = res.headers.get("x-new-access-token"); // [5]

    if (!res.ok) {
      // [6]
      const response = NextResponse.json(null, { status: 401 });
      response.cookies.delete(ACCESS_COOKIE); // [7]
      response.cookies.delete(REFRESH_COOKIE);
      return response;
    }

    const userData = await res.json(); // [8]
    const response = NextResponse.json(userData);

    if (newToken) {
      // [9]
      response.cookies.set(ACCESS_COOKIE, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 60,
      });
    }

    return response; // [10]
  } catch {
    return NextResponse.json(null, { status: 401 });
  }
}
```

| Line   | Explanation                                                                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]`  | Route Handler for `GET /api/auth/me`. Called by the browser's `fetchAuthUser()`.                                                                         |
| `[2]`  | Build headers with both tokens from cookies.                                                                                                             |
| `[3]`  | No tokens at all — return 401 immediately.                                                                                                               |
| `[4]`  | Proxy the request to the backend's `/auth/me` endpoint with both tokens.                                                                                 |
| `[5]`  | Check if the backend's middleware refreshed the token.                                                                                                   |
| `[6]`  | If auth failed even after refresh attempt...                                                                                                             |
| `[7]`  | ...clear both cookies (both tokens are invalid/expired).                                                                                                 |
| `[8]`  | Parse user data from backend response.                                                                                                                   |
| `[9]`  | If a new token was issued, update the access token cookie on the response. This is a Route Handler, so `cookies.set()` works (unlike Server Components). |
| `[10]` | Return user data to the browser.                                                                                                                         |

---

## Phase 11: Logout

> **Flow**: Browser → AuthProvider → Next.js Route Handler → Clear Cookies

### File: `client/app/api/auth/logout/route.ts`

```typescript
export async function POST() {
  // [1]
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value; // [2]

  if (refreshToken) {
    // [3]
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        // [4]
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      /* Best-effort */
    } // [5]
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ACCESS_COOKIE); // [6]
  response.cookies.delete(REFRESH_COOKIE); // [7]
  return response;
}
```

| Line  | Explanation                                                                                                                                                                                                                               |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[1]` | Handles `POST /api/auth/logout`.                                                                                                                                                                                                          |
| `[2]` | Read the refresh token from cookies.                                                                                                                                                                                                      |
| `[3]` | If there's a refresh token, notify the backend.                                                                                                                                                                                           |
| `[4]` | Call backend's logout endpoint. Currently a **no-op** on the server (stateless JWTs aren't revocable without a revocation list).                                                                                                          |
| `[5]` | Best-effort — even if the backend call fails, still clear cookies.                                                                                                                                                                        |
| `[6]` | Delete the access token cookie.                                                                                                                                                                                                           |
| `[7]` | Delete the refresh token cookie. Without these cookies, the user is effectively logged out. The access token JWT still exists and is technically valid for up to 30 minutes, but without the cookie, no browser requests will include it. |

---

## Middleware Stack & CORS

### File: `server/app/main.py`

```python
app.add_middleware(                                                      # [1]
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Cookie", "X-Refresh-Token"], # [2]
    expose_headers=["X-New-Access-Token"],                              # [3]
)

app.add_middleware(TokenRefreshMiddleware)                               # [4]
app.add_middleware(SlowAPIMiddleware)                                    # [5]
```

| Line  | Explanation                                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `[1]` | CORS middleware — required because the Next.js frontend (port 3000) calls the FastAPI backend (port 8000).                                                                                                                     |
| `[2]` | `allow_headers` — `X-Refresh-Token` is a custom header sent by the frontend. CORS blocks custom headers by default, so it must be explicitly allowed.                                                                          |
| `[3]` | `expose_headers` — `X-New-Access-Token` is a custom response header. By default, CORS only exposes standard headers to browser JavaScript. This setting allows `res.headers.get("x-new-access-token")` to work in the browser. |
| `[4]` | Register the token refresh middleware.                                                                                                                                                                                         |
| `[5]` | Rate limiting middleware.                                                                                                                                                                                                      |

**Execution order** (Starlette processes middleware in reverse order of `add_middleware` calls):

```
Request → CORS → TokenRefresh → RateLimit → RequestID → Route Handler
```

---

## Complete Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OAUTH LOGIN FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [1] User clicks "Google로 로그인"                                          │
│       ↓                                                                     │
│  [2] signInWithOAuth("google")          — client/app/actions/auth.ts        │
│       ↓                                                                     │
│  [3] GET /api/v1/auth/oauth/google/authorize                                │
│       ↓                                                                     │
│  [4] Backend generates authorization URL  — server/auth/controller.py       │
│       ↓                                                                     │
│  [5] redirect(url)  → Browser goes to Google consent page                   │
│       ↓                                                                     │
│  [6] User clicks "Allow"                                                    │
│       ↓                                                                     │
│  [7] Google redirects to /api/auth/callback/google?code=xxx                 │
│       ↓                                                                     │
│  [8] Callback Route Handler             — client/app/api/auth/callback/     │
│       ↓                                                                     │
│  [9] POST /api/v1/auth/oauth/google/callback  { code, redirect_uri }        │
│       ↓                                                                     │
│  [10] Backend:                                                              │
│       a. Exchange code → OAuth tokens   — server/auth/oauth.py              │
│       b. Fetch user profile from Google — server/auth/oauth.py              │
│       c. Find/create user in DB         — server/auth/service.py            │
│       d. Create access JWT (30 min)     — server/auth/jwt.py               │
│       e. Create refresh JWT (30 days)   — server/auth/jwt.py               │
│       ↓                                                                     │
│  [11] Return { access_token, refresh_token, user }                          │
│       ↓                                                                     │
│  [12] Store tokens as httpOnly cookies  — callback/[provider]/route.ts      │
│       ↓                                                                     │
│  [13] Redirect to callbackUrl (e.g., "/")                                   │
│       ↓                                                                     │
│  [14] AuthProvider.fetchAuthUser() → GET /api/auth/me                       │
│       ↓                                                                     │
│  [15] User is authenticated ✓                                               │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                        AUTO-REFRESH FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [1] User makes request after 30 min (access token expired)                 │
│       ↓                                                                     │
│  [2] Frontend sends both tokens via buildAuthHeaders()                      │
│       ↓                                                                     │
│  [3] TokenRefreshMiddleware intercepts   — server/auth/refresh_middleware.py │
│       a. Decode access token → ExpiredSignatureError                        │
│       b. Decode refresh token → valid (still within 30 days)                │
│       c. Create new access token from refresh claims                        │
│       d. Inject into request Authorization header                           │
│       e. Add X-New-Access-Token to response header                          │
│       ↓                                                                     │
│  [4] Route handler processes request normally (sees valid access token)      │
│       ↓                                                                     │
│  [5] Frontend reads X-New-Access-Token → updates cookie                     │
│       ↓                                                                     │
│  [6] User continues seamlessly ✓                                            │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                        LOGOUT FLOW                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [1] User clicks "로그아웃"                                                  │
│       ↓                                                                     │
│  [2] AuthProvider.logout()              — client/lib/auth/auth-context.tsx   │
│       ↓                                                                     │
│  [3] POST /api/auth/logout              — client/app/api/auth/logout/       │
│       a. Call backend POST /api/v1/auth/logout (no-op)                      │
│       b. Delete access token cookie                                         │
│       c. Delete refresh token cookie                                        │
│       ↓                                                                     │
│  [4] setUser(null), setStatus("unauthenticated")                            │
│       ↓                                                                     │
│  [5] User is logged out ✓                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Token Comparison

|                | Access Token              | Refresh Token            | OAuth Provider Token          |
| -------------- | ------------------------- | ------------------------ | ----------------------------- |
| **Issuer**     | Our backend (jwt.py)      | Our backend (jwt.py)     | Google/Kakao                  |
| **Format**     | JWT (HS256)               | JWT (HS256)              | Opaque / JWT                  |
| **Lifetime**   | 30 minutes                | 30 days                  | Varies                        |
| **Purpose**    | Authenticate API requests | Create new access tokens | Fetch user profile (one-time) |
| **Stored in**  | httpOnly cookie           | httpOnly cookie          | `accounts` table (DB)         |
| **Type claim** | `"access"`                | `"refresh"`              | N/A                           |
| **Contains**   | sub, email, name, role    | sub, email, name, role   | Provider-specific             |
