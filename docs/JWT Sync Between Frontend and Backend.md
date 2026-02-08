# JWT Sync Between Frontend and Backend

This document explains how JWT (JSON Web Token) authentication is synchronized between the Next.js frontend and the FastAPI backend in this project.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [JWT Token Structure](#jwt-token-structure)
4. [How JWT Sync Works](#how-jwt-sync-works)
5. [Frontend Implementation](#frontend-implementation)
6. [Backend Implementation](#backend-implementation)
7. [Complete Flow Diagrams](#complete-flow-diagrams)
8. [File Structure](#file-structure)
9. [Security Considerations](#security-considerations)

---

## Overview

This project uses a **shared JWT strategy** where:

1. **NextAuth (Frontend)** creates and signs JWT tokens after authentication
2. **The same JWT token** is sent to the FastAPI backend for API requests
3. **Backend** validates the JWT using the same `AUTH_SECRET`
4. **Both systems** share the same user database (PostgreSQL)

This approach eliminates the need for separate token exchanges between frontend and backend.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          JWT Sync Architecture                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│                │       │                │       │                │
│    Browser     │◄─────►│  Next.js App   │◄─────►│ FastAPI Backend│
│                │       │  (Frontend)    │       │                │
└────────────────┘       └────────────────┘       └────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│   JWT Cookie   │       │    NextAuth    │       │  JWT Decoder   │
│ (authjs.       │       │  (Creates JWT) │       │ (Validates JWT)│
│  session-token)│       │                │       │                │
└────────────────┘       └────────────────┘       └────────────────┘
                                 │                        │
                                 │                        │
                                 ▼                        ▼
                         ┌────────────────────────────────────┐
                         │         Shared PostgreSQL          │
                         │     (User, Account, Session)       │
                         └────────────────────────────────────┘
                                         │
                                         │
                                         ▼
                         ┌────────────────────────────────────┐
                         │        Shared AUTH_SECRET          │
                         │   (Used by both systems to sign/   │
                         │         verify JWT tokens)         │
                         └────────────────────────────────────┘
```

---

## JWT Token Structure

### NextAuth JWT Cookie

When a user logs in, NextAuth creates an encrypted JWT stored in a cookie:

**Cookie Name:**

- Development: `authjs.session-token`
- Production (HTTPS): `__Secure-authjs.session-token`

**Token Payload (after decryption):**

```json
{
  "id": "clx1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "role": "USER",
  "iat": 1704067200,
  "exp": 1706659200,
  "jti": "unique-token-id"
}
```

### Token Fields

| Field     | Description                      |
| --------- | -------------------------------- |
| `id`      | User's unique ID (from database) |
| `email`   | User's email address             |
| `name`    | User's display name              |
| `picture` | Profile image URL                |
| `role`    | User role (USER, ADMIN)          |
| `iat`     | Issued at timestamp              |
| `exp`     | Expiration timestamp             |
| `jti`     | JWT unique identifier            |

---

## How JWT Sync Works

### Step-by-Step Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         JWT Sync Flow                                         │
└──────────────────────────────────────────────────────────────────────────────┘

Step 1: User Authentication (Frontend)
──────────────────────────────────────
User logs in via OAuth or Credentials
        ↓
NextAuth validates credentials
        ↓
NextAuth creates JWT with user data (id, email, role)
        ↓
JWT is encrypted with AUTH_SECRET
        ↓
Encrypted JWT stored in HttpOnly cookie


Step 2: API Request (Frontend → Backend)
────────────────────────────────────────
Server Component/Action needs to call backend API
        ↓
OpenAPI client's auth() function is called
        ↓
auth() reads JWT from cookie (via next/headers)
        ↓
JWT added to request as Bearer token
        ↓
Request sent to FastAPI backend


Step 3: Token Validation (Backend)
──────────────────────────────────
Backend receives request with Authorization header
        ↓
Backend extracts Bearer token
        ↓
Backend decrypts JWT using same AUTH_SECRET
        ↓
Backend validates: signature, expiration, claims
        ↓
Backend extracts user_id from token
        ↓
Backend uses user_id to fetch user from shared database
        ↓
Request processed with authenticated user context
```

---

## Frontend Implementation

### 1. OpenAPI Runtime Configuration

**File:** `config/openapi-runtime.ts`

This is the core of JWT sync. It provides the JWT token to every API request:

```typescript
import type { CreateClientConfig } from "@/generated/openapi-client/client/types.gen";
import { cookies } from "next/headers";

// Cookie name varies by environment
const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token" // HTTPS (production)
    : "authjs.session-token"; // HTTP (development)

// Backend API URL
const API_URL = process.env.API_URL || "http://localhost:8000";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,

  // Set the base URL for all API requests
  baseUrl: API_URL,

  // Auth function called on EVERY request
  async auth() {
    // Read cookies from the incoming request
    const cookieStore = await cookies();
    // Return the JWT token value (or undefined if not logged in)
    return cookieStore.get(AUTH_COOKIE_NAME)?.value;
  },
});
```

**Key Points:**

- `auth()` is called before every API request
- Uses `next/headers` to read cookies server-side
- Returns the raw JWT cookie value
- Only works in Server Components, Server Actions, and Route Handlers

### 2. Generated OpenAPI Client

**File:** `generated/openapi-client/client.gen.ts`

The OpenAPI client is initialized with the runtime config:

```typescript
import { createClientConfig } from "../../config/openapi-runtime";
import { createClient, createConfig } from "./client";

// Client is created with our custom config
export const client = createClient(
  createClientConfig(createConfig({ baseUrl: "http://localhost:8000" }))
);
```

### 3. How Auth Token is Applied

**File:** `generated/openapi-client/client/utils.gen.ts`

When a request is made, the client:

1. Calls the `auth()` function from config
2. Gets the token value
3. Adds it to the Authorization header

```typescript
export const setAuthParams = async ({ security, ...options }) => {
  for (const auth of security) {
    // Get token by calling our auth() function
    const token = await getAuthToken(auth, options.auth);

    if (!token) continue;

    const name = auth.name ?? "Authorization";

    switch (auth.in) {
      case "header":
      default:
        // Set Authorization: Bearer <token>
        options.headers.set(name, token);
        break;
    }
  }
};
```

**File:** `generated/openapi-client/core/auth.gen.ts`

The token is formatted as Bearer token:

```typescript
export const getAuthToken = async (auth, callback) => {
  const token = typeof callback === "function" ? await callback(auth) : callback;

  if (!token) return;

  if (auth.scheme === "bearer") {
    return `Bearer ${token}`; // Adds "Bearer " prefix
  }

  return token;
};
```

### 4. SDK Functions with Security

**File:** `generated/openapi-client/sdk.gen.ts`

Each API function that requires auth includes a `security` config:

```typescript
// Public endpoint - no security
export const listPostsApiV1PostsGet = (options) =>
  client.get({
    url: "/api/v1/posts",
    ...options,
  });

// Protected endpoint - requires auth
export const createPostApiV1PostsPost = (options) =>
  client.post({
    url: "/api/v1/posts",
    security: [{ scheme: "bearer", type: "http" }], // ← Requires JWT
    ...options,
  });
```

### 5. Using the API in Server Components/Actions

**File:** `lib/api.ts`

Wrapper functions for cleaner API usage:

```typescript
import { createPostApiV1PostsPost } from "@/generated/openapi-client";

// Authentication is handled automatically!
// The JWT is read from cookies and added to the request
export async function createPost(post: PostCreate) {
  const { data, error } = await createPostApiV1PostsPost({
    body: post,
  });
  return { data, error };
}
```

**File:** `app/actions/community/mutations.ts`

Using the API in Server Actions:

```typescript
"use server";

import { createPost } from "@/lib/api";

export async function createPostAction(postData: PostCreate) {
  // JWT is automatically extracted from cookies
  // and sent to the backend
  const { data, error } = await createPost(postData);

  if (error) {
    return { error: "게시글 작성에 실패했습니다." };
  }

  return { data };
}
```

---

## Backend Implementation

The FastAPI backend receives and validates the JWT token.

### Expected Backend Flow

```python
# Backend JWT validation (conceptual - actual implementation may vary)

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

# Same secret as NextAuth
AUTH_SECRET = os.getenv("AUTH_SECRET")

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        # Decode using shared AUTH_SECRET
        payload = jwt.decode(
            token,
            AUTH_SECRET,
            algorithms=["HS256"]
        )

        user_id = payload.get("id")

        # Fetch user from shared database
        user = await db.users.find_one({"id": user_id})

        if not user:
            raise HTTPException(401, "User not found")

        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


# Protected endpoint
@app.post("/api/v1/posts")
async def create_post(
    post: PostCreate,
    current_user: User = Depends(get_current_user)  # ← JWT validated here
):
    # current_user is available from the validated JWT
    return await posts_service.create(post, user_id=current_user.id)
```

### Shared Requirements

For JWT sync to work, both systems must share:

| Requirement        | Frontend (NextAuth)   | Backend (FastAPI)    |
| ------------------ | --------------------- | -------------------- |
| **AUTH_SECRET**    | Used to encrypt JWT   | Used to decrypt JWT  |
| **Database**       | Reads/writes users    | Reads users by ID    |
| **User ID format** | CUID (e.g., `clx...`) | Same format expected |

---

## Complete Flow Diagrams

### Complete JWT Sync Flow (Create Post Example)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Complete JWT Sync Flow: Create Post                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Browser │    │  Next.js     │    │   OpenAPI    │    │   FastAPI    │
│         │    │  Server      │    │   Client     │    │   Backend    │
└────┬────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
     │                │                   │                   │
     │ 1. Submit      │                   │                   │
     │ new post form  │                   │                   │
     │───────────────>│                   │                   │
     │                │                   │                   │
     │                │ 2. Server Action  │                   │
     │                │ createPostAction()│                   │
     │                │                   │                   │
     │                │ 3. Call           │                   │
     │                │ createPost()      │                   │
     │                │──────────────────>│                   │
     │                │                   │                   │
     │                │                   │ 4. auth() called  │
     │                │                   │ Read cookie:      │
     │                │                   │ authjs.session-   │
     │                │                   │ token             │
     │                │                   │                   │
     │                │                   │ 5. Build request: │
     │                │                   │ POST /api/v1/posts│
     │                │                   │ Authorization:    │
     │                │                   │ Bearer <jwt>      │
     │                │                   │──────────────────>│
     │                │                   │                   │
     │                │                   │                   │ 6. Extract
     │                │                   │                   │ Bearer token
     │                │                   │                   │
     │                │                   │                   │ 7. Decrypt JWT
     │                │                   │                   │ with AUTH_SECRET
     │                │                   │                   │
     │                │                   │                   │ 8. Validate:
     │                │                   │                   │ - Signature
     │                │                   │                   │ - Expiration
     │                │                   │                   │ - Claims
     │                │                   │                   │
     │                │                   │                   │ 9. Extract
     │                │                   │                   │ user_id from
     │                │                   │                   │ token payload
     │                │                   │                   │
     │                │                   │                   │ 10. Query DB:
     │                │                   │                   │ SELECT * FROM
     │                │                   │                   │ users WHERE
     │                │                   │                   │ id = user_id
     │                │                   │                   │
     │                │                   │                   │ 11. Create post
     │                │                   │                   │ with user_id
     │                │                   │                   │
     │                │                   │ 12. Return        │
     │                │                   │ PostResponse      │
     │                │                   │<──────────────────│
     │                │                   │                   │
     │                │ 13. Return        │                   │
     │                │ { data }          │                   │
     │                │<──────────────────│                   │
     │                │                   │                   │
     │ 14. Show       │                   │                   │
     │ success toast  │                   │                   │
     │ Redirect to    │                   │                   │
     │ /community     │                   │                   │
     │<───────────────│                   │                   │
     │                │                   │                   │
```

### Request/Response Details

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         HTTP Request Details                                  │
└──────────────────────────────────────────────────────────────────────────────┘

Request:
────────
POST /api/v1/posts HTTP/1.1
Host: localhost:8000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNse
               DEyMzQ1Njc4OTAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLC
               JuYW1lIjoiSm9obiBEb2UiLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcw
               NDA2NzIwMCwiZXhwIjoxNzA2NjU5MjAwfQ.signature

{
  "title": "My First Post",
  "content": "Hello, World!"
}


Response (Success):
───────────────────
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "My First Post",
  "content": "Hello, World!",
  "user_id": "clx1234567890",
  "user_name": "John Doe",
  "created_at": "2024-01-01T12:00:00Z",
  "like_count": 0,
  "comment_count": 0
}


Response (Unauthorized):
────────────────────────
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "detail": "Not authenticated"
}
```

---

## File Structure

```
client/
├── config/
│   └── openapi-runtime.ts      # JWT extraction from cookies
│
├── generated/openapi-client/
│   ├── client.gen.ts           # Client initialization with config
│   ├── sdk.gen.ts              # SDK functions with security config
│   ├── types.gen.ts            # Generated TypeScript types
│   ├── client/
│   │   ├── client.gen.ts       # HTTP client implementation
│   │   ├── utils.gen.ts        # setAuthParams (applies JWT to request)
│   │   └── types.gen.ts        # Client types
│   └── core/
│       └── auth.gen.ts         # getAuthToken (formats Bearer token)
│
├── lib/
│   ├── api.ts                  # API wrapper functions
│   └── auth/
│       └── config.ts           # NextAuth configuration (creates JWT)
│
├── app/
│   └── actions/
│       └── community/
│           └── mutations.ts    # Server Actions using API
│
└── openapi-ts.config.ts        # OpenAPI codegen configuration
```

---

## Security Considerations

### 1. Cookie Security

```typescript
// NextAuth sets secure cookie attributes automatically:
{
  httpOnly: true,        // Not accessible via JavaScript
  secure: true,          // HTTPS only (production)
  sameSite: "lax",       // CSRF protection
  path: "/",             // Available on all routes
  maxAge: 30 * 24 * 60 * 60  // 30 days
}
```

### 2. Token Encryption

- NextAuth encrypts the JWT using `AUTH_SECRET`
- The encrypted token is stored in the cookie
- Backend must use the same `AUTH_SECRET` to decrypt

### 3. Environment Variables

```env
# Must be the same on both frontend and backend
AUTH_SECRET=your-very-secure-secret-key-at-least-32-chars

# Backend URL
API_URL=http://localhost:8000
```

### 4. Server-Side Only

The `cookies()` function from `next/headers` only works server-side:

- ✅ Server Components
- ✅ Server Actions
- ✅ Route Handlers
- ❌ Client Components (will throw error)

### 5. Token Expiration

```typescript
// NextAuth config
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

Backend should check the `exp` claim and reject expired tokens.

---

## Troubleshooting

### Common Issues

| Issue             | Cause                 | Solution                                     |
| ----------------- | --------------------- | -------------------------------------------- |
| 401 Unauthorized  | Token not sent        | Check cookie exists, check `auth()` function |
| 401 Invalid token | Wrong AUTH_SECRET     | Ensure same secret on frontend/backend       |
| 401 Token expired | Token past expiration | User needs to re-login                       |
| Empty auth header | Cookie not found      | Check cookie name matches environment        |

### Debugging

```typescript
// In openapi-runtime.ts
async auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  // Debug logging
  console.log("Cookie name:", AUTH_COOKIE_NAME);
  console.log("Token exists:", !!token);
  console.log("Token length:", token?.length);

  return token;
}
```

---

## Summary

| Component              | Role                                             |
| ---------------------- | ------------------------------------------------ |
| **NextAuth**           | Creates encrypted JWT after authentication       |
| **Cookie**             | Stores encrypted JWT (HttpOnly, Secure)          |
| **openapi-runtime.ts** | Extracts JWT from cookie for each request        |
| **OpenAPI Client**     | Adds JWT as Bearer token to Authorization header |
| **FastAPI Backend**    | Decrypts JWT, validates, extracts user_id        |
| **Shared Database**    | Both systems read from same User table           |
| **AUTH_SECRET**        | Shared key for JWT encryption/decryption         |
