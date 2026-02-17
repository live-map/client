# Authentication Implementation via PgAdapter

This document explains how NextAuth.js (Auth.js v5) implements authentication in this project using a custom PgAdapter that connects directly to PostgreSQL via the `pg` driver, replacing the previous PrismaAdapter approach.

## Table of Contents

1. [Overview](#overview)
2. [NextAuth Configuration](#nextauth-configuration)
3. [How the PgAdapter Works](#how-the-pgadapter-works)
4. [Authentication Flows](#authentication-flows)
5. [Frontend Integration](#frontend-integration)
6. [Backend Integration (FastAPI)](#backend-integration-fastapi)
7. [Project File Structure](#project-file-structure)
8. [Complete Flow Diagrams](#complete-flow-diagrams)

---

## Overview

NextAuth.js (Auth.js v5) is the authentication layer for this Next.js application. The key difference from the previous implementation is the **adapter**: instead of `PrismaAdapter` (which relied on Prisma ORM), we now use a **custom `PgAdapter`** that executes raw SQL queries against PostgreSQL via the `pg` driver.

This project uses:

- **OAuth Authentication**: Google, Kakao
- **JWT Session Strategy**: Stateless sessions stored in encrypted cookies (JWE)
- **Custom PgAdapter**: Direct PostgreSQL connection for user persistence
- **Shared Database**: The same PostgreSQL tables are accessed by both the Next.js client and the FastAPI backend

### Why PgAdapter Instead of PrismaAdapter?

| Concern                | PrismaAdapter                                      | PgAdapter (current)                                 |
| ---------------------- | -------------------------------------------------- | --------------------------------------------------- |
| DB driver              | Prisma Client (ORM)                                | `pg` Pool (raw SQL)                                 |
| Schema definition      | Requires `schema.prisma` + `npx prisma generate`   | Tables must exist in DB directly                    |
| ID generation          | Prisma `@default(cuid())` in schema                | Explicit `createId()` via `@paralleldrive/cuid2`    |
| Column mapping         | Prisma `@map()` annotations                        | Manual `mapUser()` function                         |
| Custom fields (`role`) | Requires extending the adapter or workarounds      | Built-in natively                                   |
| Dependencies           | `prisma`, `@prisma/client`, `@auth/prisma-adapter` | `pg`, `@paralleldrive/cuid2`                        |
| Backend compatibility  | Indirect (Prisma conventions may differ)           | Direct (same raw SQL, same column names as FastAPI) |

---

## NextAuth Configuration

### The `NextAuth({})` Function

The core of NextAuth is the `NextAuth()` function that takes a configuration object and returns authentication utilities.

**Location**: `lib/auth/config.ts`

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";

import pool from "@/lib/pg";
import { PgAdapter } from "@/lib/auth/adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PgAdapter(pool),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial login: copy user.id and user.role to token
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      // OAuth users: fetch role from DB if missing
      if (token.id && !token.role) {
        const { rows } = await pool.query("SELECT role FROM users WHERE id = $1", [token.id]);
        const dbUser = rows[0];
        if (dbUser) {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});
```

### Configuration Options Explained

#### 1. Adapter

```typescript
adapter: PgAdapter(pool);
```

The adapter receives a `pg` Pool instance and returns an object implementing the NextAuth `Adapter` interface. It handles:

- Creating users on first OAuth login (`createUser`)
- Looking up users by ID, email, or OAuth account (`getUser`, `getUserByEmail`, `getUserByAccount`)
- Linking OAuth provider accounts to users (`linkAccount`)
- Managing verification tokens (`createVerificationToken`, `useVerificationToken`)

**Database Tables Required** (must exist in PostgreSQL):

- `users` - User accounts
- `accounts` - OAuth provider connections
- `verification_tokens` - Email verification tokens

**Note**: The `sessions` table is not used because the JWT strategy stores sessions in cookies, not in the database. The adapter stubs out all session methods.

#### 2. PostgreSQL Connection Pool

**Location**: `lib/pg.ts`

```typescript
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.SESSION_POOLER_URL || process.env.DATABASE_URL,
});

export default pool;
```

A single `Pool` instance is shared between the adapter and the JWT callback. This pool manages connection reuse and handles concurrent queries efficiently.

#### 3. Providers

Providers define how users can authenticate:

```typescript
providers: [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  Kakao({
    clientId: process.env.KAKAO_CLIENT_ID!,
    clientSecret: process.env.KAKAO_CLIENT_SECRET!,
  }),
];
```

**OAuth Providers**:

- Handle the entire OAuth flow automatically
- Redirect to provider's login page
- Exchange authorization code for tokens
- Create/link user accounts via the PgAdapter

#### 4. Session Configuration

```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

**JWT Strategy** (used in this project):

- Session data stored in a JWE (JSON Web Encryption) cookie
- Stateless - no database lookups for session validation
- Cookie name: `authjs.session-token` (dev) / `__Secure-authjs.session-token` (prod)
- Encryption: A256CBC-HS512 using `AUTH_SECRET`

#### 5. Callbacks

Callbacks customize the authentication flow:

**JWT Callback** - Runs when a JWT is created or accessed:

1. On initial login: receives `user` object from the adapter, copies `id` and `role` to the token
2. On subsequent requests: receives only `token`, enriches it with DB data if `role` is missing

**Session Callback** - Runs when the session is accessed via `auth()` or `useSession()`:

1. Transfers `token.id` and `token.role` into `session.user`
2. This is what the application code sees

#### 6. Custom Pages

```typescript
pages: {
  signIn: "/auth/signin",
}
```

---

## How the PgAdapter Works

The PgAdapter is a custom implementation of the NextAuth `Adapter` interface. Instead of delegating to Prisma ORM, it executes raw SQL queries directly against PostgreSQL.

**Location**: `lib/auth/adapter.ts`

### Adapter Interface

NextAuth expects an adapter to implement specific methods. Here is how each method is implemented:

### 1. Row Mapping: `mapUser()`

Because NextAuth uses camelCase property names but the database uses snake_case columns, the adapter includes a mapping function:

```typescript
function mapUser(row: Record<string, unknown>): AdapterUser {
  return {
    id: row.id as string,
    name: (row.name as string) ?? null,
    email: (row.email as string) ?? "",
    emailVerified: row.email_verified ? new Date(row.email_verified as string) : null,
    image: (row.image as string) ?? null,
    role: (row.role as string) ?? "USER",
  };
}
```

Key points:

- `email_verified` (snake_case DB column) → `emailVerified` (camelCase NextAuth property)
- `role` is included directly — this is a custom field that PrismaAdapter does not handle natively
- Default role is `"USER"` if no value is present in the DB row

### 2. ID Generation

The adapter generates CUID2 IDs explicitly using `@paralleldrive/cuid2`:

```typescript
import { createId } from "@paralleldrive/cuid2";

// Used in createUser() and linkAccount()
const id = createId(); // e.g., "clx7a9b2c0000..."
```

With PrismaAdapter, ID generation was handled by Prisma's `@default(cuid())` directive in the schema. With PgAdapter, the application code is responsible for generating IDs before inserting rows.

### 3. User Methods

#### `createUser(user)`

Called on first OAuth login when no existing user matches the email.

```sql
INSERT INTO users (id, name, email, email_verified, image, role)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *
```

- Generates a CUID2 `id`
- Sets `role` to `"USER"` by default
- Returns the created user via `mapUser()`

#### `getUser(id)`

Called by NextAuth to look up a user by their internal ID.

```sql
SELECT * FROM users WHERE id = $1
```

#### `getUserByEmail(email)`

Called during OAuth to check if a user with this email already exists.

```sql
SELECT * FROM users WHERE email = $1
```

#### `getUserByAccount({ provider, providerAccountId })`

Called during OAuth callback to find a user already linked to this OAuth account.

```sql
SELECT u.* FROM users u
JOIN accounts a ON u.id = a.user_id
WHERE a.provider = $1 AND a.provider_account_id = $2
```

This is the critical query that determines whether a returning user is recognized. It joins `users` with `accounts` to find the user linked to a specific OAuth provider + provider account ID combination.

#### `updateUser(user)`

Called when user profile data changes (e.g., name or image updated from OAuth provider).

```sql
UPDATE users SET name = $1, email = $2, ... WHERE id = $N RETURNING *
```

Only fields that are present in the update payload are included in the SET clause. This is built dynamically to avoid overwriting fields that were not changed.

#### `deleteUser(id)`

```sql
DELETE FROM users WHERE id = $1
```

### 4. Account Methods

#### `linkAccount(account)`

Called after a new OAuth login to link the provider account to the user.

```sql
INSERT INTO accounts
  (id, user_id, type, provider, provider_account_id,
   refresh_token, access_token, expires_at,
   token_type, scope, id_token, session_state)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
```

Stores the full OAuth token set: access token, refresh token, ID token, expiration, scope, etc.

#### `unlinkAccount({ provider, providerAccountId })`

```sql
DELETE FROM accounts WHERE provider = $1 AND provider_account_id = $2
```

### 5. Session Methods (Stubbed)

Since the project uses `strategy: "jwt"`, sessions are stored in cookies, not in the database. All session methods are stubbed:

```typescript
async createSession(session) { return session; },
async getSessionAndUser()    { return null; },
async updateSession()        { return null; },
async deleteSession()        {},
```

These methods exist to satisfy the `Adapter` interface but are never called under the JWT strategy. If you were to switch to `strategy: "database"`, these would need real implementations.

### 6. Verification Token Methods

#### `createVerificationToken(token)`

```sql
INSERT INTO verification_tokens (identifier, token, expires)
VALUES ($1, $2, $3)
```

#### `useVerificationToken({ identifier, token })`

```sql
DELETE FROM verification_tokens
WHERE identifier = $1 AND token = $2
RETURNING *
```

Uses `DELETE ... RETURNING` to atomically consume the token (read and delete in one query).

### Database Schema

The adapter expects these tables to exist in PostgreSQL:

```sql
-- Users table
CREATE TABLE users (
  id VARCHAR(25) PRIMARY KEY,           -- CUID2
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  email_verified TIMESTAMP,
  hashed_password VARCHAR(255),         -- reserved for future use
  image VARCHAR(1000),
  role VARCHAR(10) DEFAULT 'USER',      -- 'USER' or 'ADMIN'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- OAuth accounts table
CREATE TABLE accounts (
  id VARCHAR(25) PRIMARY KEY,           -- CUID2
  user_id VARCHAR(25) REFERENCES users(id),
  type VARCHAR(255),                    -- "oauth"
  provider VARCHAR(255),                -- "google", "kakao"
  provider_account_id VARCHAR(255),
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(255),
  scope VARCHAR(255),
  id_token TEXT,
  session_state VARCHAR(255)
);

-- Verification tokens table
CREATE TABLE verification_tokens (
  identifier VARCHAR(255),
  token VARCHAR(255),
  expires TIMESTAMP
);
```

---

## Authentication Flows

### OAuth Login Flow (Google/Kakao)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              OAuth Login Flow                                │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────┐      ┌──────────────┐      ┌─────────────┐      ┌────────────────┐
│  User   │      │   Frontend   │      │   NextAuth  │      │ OAuth Provider │
└────┬────┘      └──────┬───────┘      └──────┬──────┘      └───────┬────────┘
     │                  │                     │                     │
     │ 1. Click         │                     │                     │
     │ "Google로 계속"   │                     │                     │
     │─────────────────>│                     │                     │
     │                  │                     │                     │
     │                  │ 2. Server Action    │                     │
     │                  │ signInWithOAuth()   │                     │
     │                  │────────────────────>│                     │
     │                  │                     │                     │
     │                  │                     │ 3. Redirect to      │
     │                  │                     │ Google OAuth        │
     │                  │<────────────────────│────────────────────>│
     │                  │                     │                     │
     │ 4. User sees Google login page         │                     │
     │<───────────────────────────────────────────────────────────>│
     │                  │                     │                     │
     │ 5. User grants   │                     │                     │
     │ permission       │                     │                     │
     │─────────────────────────────────────────────────────────────>│
     │                  │                     │                     │
     │                  │                     │ 6. Callback with    │
     │                  │                     │ authorization code  │
     │                  │                     │<────────────────────│
     │                  │                     │                     │
     │                  │                     │ 7. Exchange code    │
     │                  │                     │ for tokens          │
     │                  │                     │────────────────────>│
     │                  │                     │                     │
     │                  │                     │ 8. Return user info │
     │                  │                     │<────────────────────│
     │                  │                     │                     │
     │                  │                     │ 9. PgAdapter:       │
     │                  │                     │ getUserByAccount()  │
     │                  │                     │ → check if linked   │
     │                  │                     │                     │
     │                  │                     │ 10. If new user:    │
     │                  │                     │ createUser() +      │
     │                  │                     │ linkAccount()       │
     │                  │                     │                     │
     │                  │                     │ 11. Generate JWT    │
     │                  │                     │ Run jwt callback    │
     │                  │                     │                     │
     │                  │ 12. Set JWE cookie  │                     │
     │                  │ & redirect to home  │                     │
     │                  │<────────────────────│                     │
     │                  │                     │                     │
     │ 13. User sees    │                     │                     │
     │ authenticated UI │                     │                     │
     │<─────────────────│                     │                     │
     │                  │                     │                     │
```

### Session Check Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Session Check Flow                                │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────┐      ┌──────────────┐      ┌─────────────┐
│ Browser │      │    Server    │      │   NextAuth  │
└────┬────┘      └──────┬───────┘      └──────┬──────┘
     │                  │                     │
     │ 1. Request page  │                     │
     │ (with cookie)    │                     │
     │─────────────────>│                     │
     │                  │                     │
     │                  │ 2. Server Component │
     │                  │ calls auth()        │
     │                  │────────────────────>│
     │                  │                     │
     │                  │                     │ 3. Read JWE from
     │                  │                     │ cookie
     │                  │                     │
     │                  │                     │ 4. Decrypt using
     │                  │                     │ AUTH_SECRET
     │                  │                     │
     │                  │                     │ 5. Run jwt callback
     │                  │                     │ (enrich with DB role
     │                  │                     │ if missing)
     │                  │                     │
     │                  │                     │ 6. Run session
     │                  │                     │ callback
     │                  │                     │
     │                  │ 7. Return session   │
     │                  │ { user: { id, role }}│
     │                  │<────────────────────│
     │                  │                     │
     │                  │ 8. Render page with │
     │                  │ user data           │
     │                  │                     │
     │ 9. Display       │                     │
     │ authenticated UI │                     │
     │<─────────────────│                     │
     │                  │                     │
```

### Backend API Call Flow (Client → FastAPI)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Backend API Call Flow                                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────┐      ┌──────────────┐      ┌─────────────┐      ┌────────────────┐
│ Browser │      │  Next.js     │      │  lib/api.ts  │      │    FastAPI     │
│         │      │  Server      │      │  (apiFetch)  │      │    Backend     │
└────┬────┘      └──────┬───────┘      └──────┬──────┘      └───────┬────────┘
     │                  │                     │                     │
     │ 1. Request page  │                     │                     │
     │ (cookie attached)│                     │                     │
     │─────────────────>│                     │                     │
     │                  │                     │                     │
     │                  │ 2. Server Component │                     │
     │                  │ or Server Action    │                     │
     │                  │ calls apiFetch()    │                     │
     │                  │────────────────────>│                     │
     │                  │                     │                     │
     │                  │                     │ 3. Read JWE token   │
     │                  │                     │ from cookie         │
     │                  │                     │                     │
     │                  │                     │ 4. Send as          │
     │                  │                     │ Authorization:      │
     │                  │                     │ Bearer <JWE>        │
     │                  │                     │────────────────────>│
     │                  │                     │                     │
     │                  │                     │                     │ 5. jwt_guard
     │                  │                     │                     │ extracts token
     │                  │                     │                     │
     │                  │                     │                     │ 6. Decrypts JWE
     │                  │                     │                     │ using AUTH_SECRET
     │                  │                     │                     │
     │                  │                     │                     │ 7. Validates exp
     │                  │                     │                     │
     │                  │                     │                     │ 8. Injects
     │                  │                     │                     │ JWTPayload to
     │                  │                     │                     │ route handler
     │                  │                     │                     │
     │                  │                     │ 9. JSON response    │
     │                  │                     │<────────────────────│
     │                  │                     │                     │
     │                  │ 10. Render with data│                     │
     │                  │<────────────────────│                     │
     │                  │                     │                     │
     │ 11. Display page │                     │                     │
     │<─────────────────│                     │                     │
     │                  │                     │                     │
```

---

## Frontend Integration

### 1. Session Provider (Client-Side)

**Location**: `app/providers.tsx`

```typescript
"use client";

import { SessionProvider } from "next-auth/react";
import { LoginModalProvider } from "@/components/auth/login-modal";

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <LoginModalProvider>
        {children}
      </LoginModalProvider>
    </SessionProvider>
  );
}
```

Wraps the app to provide session context for client components. `LoginModalProvider` allows any component to trigger a login dialog via `useLoginModal()`.

### 2. Server-Side Session Check

```typescript
import { auth } from "@/lib/auth";

export default async function SomePage() {
  const session = await auth();

  if (!session) {
    // User is not authenticated
  }

  // session.user.id, session.user.role are available
}
```

### 3. Client-Side Session Check

**Location**: `components/layout/main-header.tsx`

```typescript
"use client";

import { useSession, signIn } from "next-auth/react";

export function MainHeader() {
  const { status } = useSession();

  return (
    <>
      {status === "authenticated" ? (
        <Link href="/profile">마이페이지</Link>
      ) : status === "unauthenticated" ? (
        <button onClick={() => signIn()}>로그인</button>
      ) : null}
    </>
  );
}
```

### 4. Server Action for OAuth SignIn

**Location**: `app/actions/auth.ts`

```typescript
"use server";

import { signIn as nextAuthSignIn } from "@/lib/auth";

export async function signInWithOAuth(
  provider: "google" | "kakao",
  callbackUrl = "/"
): Promise<void> {
  await nextAuthSignIn(provider, { redirectTo: callbackUrl });
}
```

### 5. OAuth Button Component

**Location**: `components/auth/oauth-button.tsx`

```typescript
"use client";

export function OAuthButton({ provider, callbackUrl }: OAuthButtonProps) {
  return (
    <form action={() => signInWithOAuth(provider, callbackUrl)}>
      <Button type="submit" variant="outline" className="w-full">
        {config.icon}
        {config.name}로 계속하기
      </Button>
    </form>
  );
}
```

### 6. Login Modal (Context-Based)

**Location**: `components/auth/login-modal.tsx`

Any component can trigger login without page navigation:

```typescript
const { openLoginModal } = useLoginModal();

// When a non-authenticated user tries a protected action:
openLoginModal("투표하려면 로그인이 필요합니다.");
```

The modal renders `OAuthButton` for each provider, passing the current `pathname` as the callback URL so the user returns to the same page after login.

### 7. Protected Server Actions (withAuth HOF)

**Location**: `lib/auth/with-auth.ts`

```typescript
export function withAuth<TArgs extends unknown[], TResult>(
  action: (ctx: AuthContext, ...args: TArgs) => Promise<ActionResult<TResult>>
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return async (...args) => {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    const ctx: AuthContext = {
      user: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name,
        image: session.user.image,
      },
    };

    return await action(ctx, ...args);
  };
}
```

This Higher-Order Function wraps server actions that require authentication. It calls `auth()` internally, which decrypts the JWE cookie and runs the session callback to produce the session object.

---

## Backend Integration (FastAPI)

The FastAPI backend validates the same JWE tokens issued by NextAuth. This works because both sides share the same `AUTH_SECRET`.

### Token Transport: Client → Backend

**Location**: `lib/api.ts`

```typescript
const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token";

async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

async function apiFetch<T>(path: string, options?: RequestInit) {
  const token = await getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  // ...
}
```

The JWE token from the cookie is forwarded as a `Bearer` token in the `Authorization` header. The FastAPI backend's `jwt_guard` then decrypts it using the shared `AUTH_SECRET` and extracts the user payload (`user_id`, `email`, `name`, `role`).

---

## Project File Structure

```
client/
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts              # NextAuth API route handlers
│   ├── auth/
│   │   └── signin/page.tsx       # Custom sign-in page
│   ├── actions/
│   │   └── auth.ts               # Server Action: signInWithOAuth()
│   └── providers.tsx             # SessionProvider + LoginModalProvider
│
├── components/auth/
│   ├── oauth-button.tsx          # OAuth provider buttons (Google, Kakao)
│   └── login-modal.tsx           # Context-based login dialog
│
├── lib/
│   ├── auth/
│   │   ├── config.ts             # NextAuth configuration (PgAdapter)
│   │   ├── adapter.ts            # Custom PgAdapter implementation
│   │   ├── index.ts              # Re-exports auth utilities
│   │   ├── with-auth.ts          # HOF for protected server actions
│   │   └── ownership.ts          # Ownership verification
│   ├── pg.ts                     # PostgreSQL Pool singleton
│   └── api.ts                    # Backend API client (Bearer token forwarding)
│
├── types/
│   └── next-auth.d.ts            # TypeScript type extensions (id, role)
│
└── docs/
    └── Authentication Implementation via PgAdapter.md  # This file
```

---

## Complete Flow Diagrams

### Complete OAuth Flow (User Clicks Google Button → Authenticated State)

```
Step 1: User clicks "Google로 계속하기" button in OAuthButton component
        ↓
Step 2: Form action triggers signInWithOAuth("google") Server Action
        ↓
Step 3: Server Action calls signIn("google", { redirectTo: "/" })
        ↓
Step 4: NextAuth generates authorization URL with:
        - client_id (GOOGLE_CLIENT_ID)
        - redirect_uri (/api/auth/callback/google)
        - scope (email, profile)
        - state (CSRF protection)
        ↓
Step 5: Browser redirects to Google OAuth consent screen
        ↓
Step 6: User logs into Google and grants permissions
        ↓
Step 7: Google redirects to /api/auth/callback/google?code=xxx&state=xxx
        ↓
Step 8: NextAuth handlers (GET) processes callback:
        a. Validates state parameter
        b. Exchanges authorization code for access_token
        c. Fetches user profile from Google
        ↓
Step 9: PgAdapter.getUserByAccount() runs:
        → SELECT u.* FROM users u JOIN accounts a ON u.id = a.user_id
          WHERE a.provider = 'google' AND a.provider_account_id = '...'
        → If user found: returns existing user (skip to Step 11)
        → If not found: continue to Step 10
        ↓
Step 10: PgAdapter creates new user:
         a. createUser():
            → id = createId()  (CUID2)
            → INSERT INTO users (id, name, email, email_verified, image, role)
              VALUES ($1, $2, $3, $4, $5, 'USER')
         b. linkAccount():
            → id = createId()
            → INSERT INTO accounts (id, user_id, type, provider, provider_account_id,
              refresh_token, access_token, expires_at, ...)
        ↓
Step 11: JWT callback runs:
         a. Receives user object from PgAdapter (including user.role)
         b. Sets token.id = user.id
         c. Sets token.role = user.role
         → Returns enhanced token
        ↓
Step 12: Session callback runs:
         a. Copies token.id → session.user.id
         b. Copies token.role → session.user.role
        ↓
Step 13: NextAuth encrypts JWT into JWE cookie:
         - Cookie name: authjs.session-token
         - Encryption: A256CBC-HS512 using AUTH_SECRET
         - Payload: { id, role, email, name, exp, iat }
         - Flags: HttpOnly, SameSite
        ↓
Step 14: Browser redirects to "/" (home page)
        ↓
Step 15: Home page Server Component renders
         → Client component calls useSession()
         → SessionProvider fetches /api/auth/session
         → NextAuth decrypts cookie, runs callbacks
         → Returns session: { user: { id, role, name, email, image } }
        ↓
Step 16: MainHeader shows "마이페이지" link (authenticated state)
```

### Complete Backend API Call Flow (Authenticated Request to FastAPI)

```
Step 1: Server Component or Server Action needs backend data
        ↓
Step 2: Calls apiFetch("/api/v1/polls") from lib/api.ts
        ↓
Step 3: getAuthToken() reads JWE from cookie:
        → cookies().get("authjs.session-token")?.value
        → Returns raw JWE string (or null if not logged in)
        ↓
Step 4: apiFetch() sends request to FastAPI:
        → GET http://localhost:8000/api/v1/polls
        → Headers: { Authorization: "Bearer <JWE token>" }
        ↓
Step 5: FastAPI jwt_guard intercept:
        a. Extracts token from Authorization header
        b. Decrypts JWE using AUTH_SECRET (must match frontend)
        c. Parses JSON payload: { id, role, email, name, exp, iat }
        d. Checks exp > current time
        ↓
Step 6: If valid → injects JWTPayload into route handler:
        → current_user.user_id = token.id
        → current_user.role = token.role
        If invalid → returns 401 Unauthorized
        ↓
Step 7: Route handler executes business logic using current_user
        ↓
Step 8: JSON response returns to Next.js server
        ↓
Step 9: Server Component renders with the data
```

---

## TypeScript Type Extensions

**Location**: `types/next-auth.d.ts`

```typescript
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role?: string;
  }
}
```

These declarations extend NextAuth's built-in types so that `session.user.id`, `session.user.role`, `token.id`, and `token.role` are recognized by TypeScript throughout the application.

---

## Key Concepts Summary

| Concept             | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| **PgAdapter**       | Custom adapter connecting NextAuth to PostgreSQL via raw SQL  |
| **pg Pool**         | Shared PostgreSQL connection pool (`lib/pg.ts`)               |
| **createId()**      | CUID2 ID generation for new users and accounts                |
| **mapUser()**       | Converts DB rows (snake_case) to NextAuth objects (camelCase) |
| **JWT Strategy**    | Store session in JWE-encrypted cookie (stateless)             |
| **Callbacks**       | Enrich token with `id` and `role`, expose via session         |
| **handlers**        | API routes for auth endpoints (`/api/auth/*`)                 |
| **auth()**          | Get current session (server-side)                             |
| **signIn()**        | Initiate login (server-side)                                  |
| **signOut()**       | End session (server-side)                                     |
| **SessionProvider** | React context for client-side session                         |
| **useSession()**    | Hook for client-side session access                           |
| **useLoginModal()** | Hook to trigger login dialog from any component               |
| **withAuth()**      | HOF to protect server actions with auth check                 |
| **apiFetch()**      | Forwards JWE cookie as Bearer token to FastAPI backend        |

---

## Environment Variables Required

```env
# NextAuth
AUTH_SECRET=your-secret-key          # MUST match backend AUTH_SECRET

# OAuth Providers
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...

# Database (PostgreSQL)
SESSION_POOLER_URL=postgresql://...   # Used by pg Pool
DATABASE_URL=postgresql://...         # Fallback

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```
