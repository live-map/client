# Authentication Implementation via NextAuth

This document explains how NextAuth.js (Auth.js v5) implements authentication in this project, covering the configuration, authentication flows, and how it integrates with the frontend.

## Table of Contents

1. [Overview](#overview)
2. [NextAuth Configuration](#nextauth-configuration)
3. [How NextAuth({}) Initializes](#how-nextauth-initializes)
4. [Authentication Flows](#authentication-flows)
5. [Frontend Integration](#frontend-integration)
6. [Project File Structure](#project-file-structure)
7. [Complete Flow Diagrams](#complete-flow-diagrams)

---

## Overview

NextAuth.js (now called Auth.js) is a complete authentication solution for Next.js applications. In this project, we use NextAuth v5 (beta) which provides:

- **OAuth Authentication**: Google, Discord, Kakao
- **Credentials Authentication**: Email/Password login
- **JWT Session Strategy**: Stateless sessions stored in cookies
- **Prisma Adapter**: Database integration for user persistence

---

## NextAuth Configuration

### The `NextAuth({})` Function

The core of NextAuth is the `NextAuth()` function that takes a configuration object and returns authentication utilities.

**Location**: `lib/auth/config.ts`

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [...],
  session: {...},
  callbacks: {...},
  pages: {...},
});
```

### Configuration Options Explained

#### 1. Adapter

```typescript
adapter: PrismaAdapter(prisma);
```

The adapter connects NextAuth to your database. It handles:

- Creating users on first OAuth login
- Storing OAuth account links (Google, Discord accounts linked to users)
- Managing sessions (if using database strategy)
- Storing verification tokens

**Database Models Required** (in `prisma/schema.prisma`):

- `User` - User accounts
- `Account` - OAuth provider connections
- `Session` - Database sessions (optional with JWT)
- `VerificationToken` - Email verification tokens

#### 2. Providers

Providers define how users can authenticate:

```typescript
providers: [
  // OAuth Providers
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  Discord({...}),
  Kakao({...}),

  // Credentials Provider (Email/Password)
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      // Custom validation logic
      // Returns user object or null
    },
  }),
]
```

**OAuth Providers**:

- Handle the entire OAuth flow automatically
- Redirect to provider's login page
- Exchange authorization code for tokens
- Create/link user accounts via adapter

**Credentials Provider**:

- Custom authentication logic
- You implement the `authorize()` function
- Must validate credentials and return user object

#### 3. Session Configuration

```typescript
session: {
  strategy: "jwt",      // "jwt" or "database"
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

**JWT Strategy** (used in this project):

- Session data stored in encrypted cookie
- Stateless - no database lookups for session
- Faster but can't invalidate individual sessions

**Database Strategy**:

- Session stored in database
- Requires Session model in database
- Can invalidate sessions individually

#### 4. Callbacks

Callbacks allow customizing the authentication flow:

```typescript
callbacks: {
  async jwt({ token, user }) {
    // Called when JWT is created or updated
    // Add custom fields to the token
    if (user?.id) {
      token.id = user.id;
      token.role = user.role;
    }
    return token;
  },

  async session({ session, token }) {
    // Called when session is checked
    // Transfer token data to session object
    if (session.user) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
    }
    return session;
  },
}
```

**JWT Callback Flow**:

1. User logs in → `jwt` callback receives `user` object
2. Subsequent requests → `jwt` callback receives only `token`
3. Custom data added to token persists in cookie

**Session Callback Flow**:

1. Called whenever session is accessed
2. Receives JWT token data
3. Shapes the session object returned to the app

#### 5. Custom Pages

```typescript
pages: {
  signIn: "/auth/signin",  // Custom sign-in page
  // signOut: "/auth/signout",
  // error: "/auth/error",
  // verifyRequest: "/auth/verify-request",
}
```

---

## How NextAuth Initializes

When you call `NextAuth({...})`, it returns four key exports:

### 1. `handlers`

```typescript
export const { GET, POST } = handlers;
```

These are Next.js App Router route handlers for `/api/auth/*`:

| Route                          | Method | Purpose                               |
| ------------------------------ | ------ | ------------------------------------- |
| `/api/auth/signin`             | GET    | Show sign-in page                     |
| `/api/auth/signin/:provider`   | POST   | Initiate OAuth or credentials sign-in |
| `/api/auth/callback/:provider` | GET    | Handle OAuth callback                 |
| `/api/auth/signout`            | POST   | Sign out user                         |
| `/api/auth/session`            | GET    | Get current session                   |
| `/api/auth/csrf`               | GET    | Get CSRF token                        |
| `/api/auth/providers`          | GET    | List configured providers             |

### 2. `auth`

```typescript
const session = await auth();
```

A function to get the current session. Works in:

- Server Components
- Server Actions
- Route Handlers
- Middleware

Returns `Session | null`:

```typescript
{
  user: {
    id: "clx...",
    name: "John Doe",
    email: "john@example.com",
    image: "https://...",
    role: "USER"
  },
  expires: "2024-02-01T00:00:00.000Z"
}
```

### 3. `signIn`

```typescript
await signIn("google", { redirectTo: "/" });
await signIn("credentials", { email, password, redirectTo: "/" });
```

Server-side function to initiate sign-in:

- For OAuth: Redirects to provider
- For Credentials: Validates and creates session

### 4. `signOut`

```typescript
await signOut({ redirectTo: "/" });
```

Server-side function to sign out the user:

- Clears session cookie
- Redirects to specified URL

---

## Authentication Flows

### OAuth Login Flow (Google/Discord/Kakao)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              OAuth Login Flow                                 │
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
     │                  │                     │ 9. Create/Link user │
     │                  │                     │ in database         │
     │                  │                     │ (via PrismaAdapter) │
     │                  │                     │                     │
     │                  │                     │ 10. Generate JWT    │
     │                  │                     │ Run jwt callback    │
     │                  │                     │                     │
     │                  │ 11. Set cookie &    │                     │
     │                  │ redirect to home    │                     │
     │                  │<────────────────────│                     │
     │                  │                     │                     │
     │ 12. User sees    │                     │                     │
     │ "Welcome, John!" │                     │                     │
     │<─────────────────│                     │                     │
     │                  │                     │                     │
```

### Credentials Login Flow (Email/Password)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Credentials Login Flow                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│  User   │      │   Frontend   │      │   NextAuth  │      │   Database   │
└────┬────┘      └──────┬───────┘      └──────┬──────┘      └──────┬───────┘
     │                  │                     │                    │
     │ 1. Enter email   │                     │                    │
     │ and password     │                     │                    │
     │─────────────────>│                     │                    │
     │                  │                     │                    │
     │                  │ 2. Form submit      │                    │
     │                  │ calls Server Action │                    │
     │                  │ signInWithCredentials()                  │
     │                  │────────────────────>│                    │
     │                  │                     │                    │
     │                  │                     │ 3. signIn("credentials")
     │                  │                     │ triggers authorize()
     │                  │                     │                    │
     │                  │                     │ 4. Find user       │
     │                  │                     │ by email           │
     │                  │                     │───────────────────>│
     │                  │                     │                    │
     │                  │                     │ 5. Return user     │
     │                  │                     │ with hashedPassword│
     │                  │                     │<───────────────────│
     │                  │                     │                    │
     │                  │                     │ 6. bcrypt.compare()│
     │                  │                     │ password           │
     │                  │                     │                    │
     │                  │                     │ 7. If valid,       │
     │                  │                     │ return user object │
     │                  │                     │                    │
     │                  │                     │ 8. Generate JWT    │
     │                  │                     │ Run jwt callback   │
     │                  │                     │                    │
     │                  │ 9. Set cookie &     │                    │
     │                  │ redirect to home    │                    │
     │                  │<────────────────────│                    │
     │                  │                     │                    │
     │ 10. User sees    │                     │                    │
     │ "Welcome, John!" │                     │                    │
     │<─────────────────│                     │                    │
     │                  │                     │                    │
```

### Session Check Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Session Check Flow                                 │
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
     │                  │                     │ 3. Read JWT from
     │                  │                     │ cookie
     │                  │                     │
     │                  │                     │ 4. Verify & decode
     │                  │                     │ JWT token
     │                  │                     │
     │                  │                     │ 5. Run session
     │                  │                     │ callback
     │                  │                     │
     │                  │ 6. Return session   │
     │                  │ object              │
     │                  │<────────────────────│
     │                  │                     │
     │                  │ 7. Render page with │
     │                  │ user data           │
     │                  │                     │
     │ 8. Display       │                     │
     │ "Welcome, John!" │                     │
     │<─────────────────│                     │
     │                  │                     │
```

---

## Frontend Integration

### 1. Session Provider (Client-Side)

**Location**: `app/providers.tsx`

```typescript
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
```

This wraps the app to provide session context for client components.

### 2. Server-Side Session Check

**Location**: `app/page.tsx`

```typescript
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main>
      {session ? (
        <p>{session.user?.name}님 환영합니다</p>
      ) : (
        <Link href="/auth/signin">로그인</Link>
      )}
    </main>
  );
}
```

### 3. Client-Side Session Check

```typescript
"use client";

import { useSession } from "next-auth/react";

export function ProfileButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <Spinner />;
  if (!session) return <SignInButton />;

  return <span>{session.user?.name}</span>;
}
```

### 4. Server Actions for Authentication

**Location**: `app/actions/auth.ts`

```typescript
"use server";

import { signIn as nextAuthSignIn } from "@/lib/auth";

// OAuth Login
export async function signInWithOAuth(provider: "google" | "discord") {
  await nextAuthSignIn(provider, { redirectTo: "/" });
}

// Credentials Login
export async function signInWithCredentials(formData: FormData) {
  await nextAuthSignIn("credentials", {
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: "/",
  });
}

// Registration (creates user, then logs in)
export async function register(formData: FormData) {
  // 1. Validate input
  // 2. Check email uniqueness
  // 3. Hash password with bcrypt
  // 4. Create user in database
  // 5. Auto-login with credentials
}
```

### 5. OAuth Button Component

**Location**: `components/auth/oauth-button.tsx`

```typescript
"use client";

export function OAuthButton({ provider }: { provider: "google" | "discord" }) {
  return (
    <form action={() => signInWithOAuth(provider)}>
      <Button type="submit">
        {provider}로 계속하기
      </Button>
    </form>
  );
}
```

### 6. Route Protection (Proxy/Middleware)

**Location**: `proxy.ts`

```typescript
import { getToken } from "next-auth/jwt";

export default async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;

  // Redirect unauthenticated users from protected routes
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
}
```

---

## Project File Structure

```
client/
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts              # NextAuth API route handlers
│   ├── auth/
│   │   ├── signin/page.tsx       # Custom sign-in page
│   │   └── register/page.tsx     # Registration page
│   ├── actions/
│   │   └── auth.ts               # Server Actions for auth
│   ├── providers.tsx             # SessionProvider wrapper
│   └── page.tsx                  # Home page (uses auth())
│
├── components/auth/
│   └── oauth-button.tsx          # OAuth provider buttons
│
├── lib/auth/
│   ├── config.ts                 # NextAuth configuration
│   ├── index.ts                  # Re-exports auth utilities
│   └── with-auth.ts              # HOF for protected actions
│
├── prisma/
│   └── schema.prisma             # Database models (User, Account, Session)
│
├── types/
│   └── next-auth.d.ts            # TypeScript type extensions
│
└── proxy.ts                      # Route protection middleware
```

---

## Complete Flow Diagrams

### Complete OAuth Flow (User Clicks Google Button → Sees Welcome Message)

```
Step 1: User clicks "Google로 계속하기" button
        ↓
Step 2: Form action triggers signInWithOAuth("google") Server Action
        ↓
Step 3: Server Action calls signIn("google", { redirectTo: "/" })
        ↓
Step 4: NextAuth generates authorization URL with:
        - client_id
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
        b. Exchanges code for access_token
        c. Fetches user profile from Google
        ↓
Step 9: PrismaAdapter checks if user exists:
        - If new: Creates User and Account records
        - If existing: Links Account to existing User
        ↓
Step 10: JWT callback runs:
         - Adds user.id to token
         - Fetches role from database
         - Returns enhanced token
         ↓
Step 11: Session callback runs (for initial session):
         - Copies token.id to session.user.id
         - Copies token.role to session.user.role
         ↓
Step 12: NextAuth sets encrypted JWT cookie:
         - Cookie name: authjs.session-token
         - Contains: { id, role, email, name, ... }
         - HttpOnly, Secure, SameSite
         ↓
Step 13: Browser redirects to "/" (home page)
         ↓
Step 14: Home page Server Component calls auth()
         ↓
Step 15: auth() reads and decrypts JWT cookie
         ↓
Step 16: Session callback runs again:
         - Returns session with user data
         ↓
Step 17: Page renders: "{name}님 환영합니다"
```

### Complete Credentials Flow (User Submits Login Form → Sees Welcome Message)

```
Step 1: User enters email and password
        ↓
Step 2: Form submits to onSubmit handler
        ↓
Step 3: onSubmit calls signInWithCredentials() Server Action
        ↓
Step 4: Server Action validates input with Zod schema
        ↓
Step 5: Server Action calls signIn("credentials", { email, password })
        ↓
Step 6: Credentials provider's authorize() function runs:
        a. Finds user by email in database
        b. Compares password with bcrypt
        c. Returns user object if valid
        ↓
Step 7: JWT callback runs:
         - Adds user.id to token
         - Adds user.role to token
         - Returns enhanced token
         ↓
Step 8: Session callback runs:
         - Copies token data to session.user
         ↓
Step 9: NextAuth sets encrypted JWT cookie
         ↓
Step 10: NextAuth throws NEXT_REDIRECT to "/"
         ↓
Step 11: Server Action catches and re-throws redirect
         ↓
Step 12: Browser redirects to "/" (home page)
         ↓
Step 13: Home page Server Component calls auth()
         ↓
Step 14: auth() decrypts JWT and returns session
         ↓
Step 15: Page renders: "{name}님 환영합니다"
```

---

## Key Concepts Summary

| Concept             | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| **Adapter**         | Connects NextAuth to database for user persistence |
| **Providers**       | Define authentication methods (OAuth, Credentials) |
| **JWT Strategy**    | Store session in encrypted cookie (stateless)      |
| **Callbacks**       | Customize token/session data                       |
| **handlers**        | API routes for auth endpoints                      |
| **auth()**          | Get current session (server-side)                  |
| **signIn()**        | Initiate login (server-side)                       |
| **signOut()**       | End session (server-side)                          |
| **SessionProvider** | React context for client-side session              |
| **useSession()**    | Hook for client-side session access                |

---

## Environment Variables Required

```env
# NextAuth
AUTH_SECRET=your-secret-key

# OAuth Providers
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...

# Database
DATABASE_URL=postgresql://...
```
