# OpenAPI Client Integration

This document explains how the frontend (Next.js) communicates with the backend (FastAPI) using `@hey-api/openapi-ts` to generate a type-safe API client.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              OpenAPI Code Generation & API Flow                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

                                    BUILD TIME (Code Generation)
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                     │
  │   FastAPI Backend              OpenAPI Spec              Generated Client           │
  │   ┌─────────────────┐         ┌─────────────────┐       ┌─────────────────┐        │
  │   │                 │         │                 │       │                 │        │
  │   │  @router.get()  │  auto   │  openapi.json   │  npm  │  sdk.gen.ts     │        │
  │   │  @router.post() │ ──────▶ │                 │ ────▶ │  types.gen.ts   │        │
  │   │  Pydantic DTOs  │ generate│  - paths        │ gen   │  client.gen.ts  │        │
  │   │                 │         │  - schemas      │       │                 │        │
  │   └─────────────────┘         └─────────────────┘       └────────┬────────┘        │
  │         :8000                  :8000/openapi.json                 │                 │
  │                                                                   │                 │
  └───────────────────────────────────────────────────────────────────│─────────────────┘
                                                                      │
                                                                      ▼
                                    DEVELOPMENT (Wrapper Creation)
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                     │
  │   lib/api.ts (manually written)                                                     │
  │   ┌─────────────────────────────────────────────────────────────────────────┐      │
  │   │                                                                         │      │
  │   │  // Wrap complex generated function names with simple ones              │      │
  │   │  export async function getPostList(limit, offset) {                     │      │
  │   │    const { data, error } = await listPostsApiV1PostsGet({...});         │      │
  │   │    return { data, error };                                              │      │
  │   │  }                                                                      │      │
  │   │                                                                         │      │
  │   └─────────────────────────────────────────────────────────────────────────┘      │
  │                                         │                                          │
  └─────────────────────────────────────────│──────────────────────────────────────────┘
                                            │
                                            ▼
                                    RUNTIME (API Calls)
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                                                                                     │
  │   Next.js App                                              FastAPI Backend          │
  │   ┌──────────────────────┐                                ┌──────────────────────┐ │
  │   │                      │                                │                      │ │
  │   │  Server Component    │    HTTP Request                │  jwt_guard.py        │ │
  │   │  Server Action       │ ─────────────────────────────▶ │  ↓                   │ │
  │   │  Route Handler       │    Authorization: Bearer xxx   │  Controller          │ │
  │   │         │            │                                │  ↓                   │ │
  │   │         ▼            │    { data } or { error }       │  Service             │ │
  │   │  lib/api.ts          │ ◀───────────────────────────── │  ↓                   │ │
  │   │         │            │    JSON Response               │  Repository          │ │
  │   │         ▼            │                                │                      │ │
  │   │  openapi-runtime.ts  │                                └──────────────────────┘ │
  │   │  (cookie → token)    │                                        :8000            │
  │   │                      │                                                         │
  │   └──────────────────────┘                                                         │
  │           :3000                                                                    │
  │                                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
client/
├── openapi-ts.config.ts              # [Config] Code generation settings
├── config/
│   └── openapi-runtime.ts            # [Config] Runtime settings (baseUrl, auth)
├── generated/
│   └── openapi-client/               # [Auto-generated] DO NOT MODIFY!
│       ├── index.ts                  # Main exports
│       ├── sdk.gen.ts                # API methods (listPostsApiV1PostsGet, etc.)
│       ├── types.gen.ts              # Type definitions (PostResponse, etc.)
│       ├── client.gen.ts             # HTTP client instance
│       └── client/
│           ├── client.gen.ts         # Client creation logic
│           └── types.gen.ts          # RequestResult types, etc.
└── lib/
    └── api.ts                        # [Manual] API wrapper functions
```

---

## Implementation Details

### 1. Dependencies Installed

```json
{
  "devDependencies": {
    "@hey-api/openapi-ts": "^0.92.3",
    "@hey-api/client-next": "^0.5.1"
  }
}
```

### 2. Configuration File: `openapi-ts.config.ts`

Located at the project root, this file configures the code generator:

```typescript
import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  // Backend OpenAPI spec URL (server must be running)
  input: "http://localhost:8000/openapi.json",

  // Generated files output directory
  output: "generated/openapi-client",

  plugins: [
    {
      // Next.js optimized HTTP client
      name: "@hey-api/client-next",
      // Runtime config file path (relative to output)
      runtimeConfigPath: "../../config/openapi-runtime.ts",
    },
    {
      // SDK generation plugin
      name: "@hey-api/sdk",
      // false: functional API (getPostList, etc.)
      asClass: false,
    },
  ],
});
```

### 3. Runtime Configuration: `config/openapi-runtime.ts`

This file configures the HTTP client at runtime:

```typescript
import type { CreateClientConfig } from "@/generated/openapi-client/client/types.gen";
import { cookies } from "next/headers";

// Environment-specific cookie name (set by NextAuth)
const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token" // HTTPS environment
    : "authjs.session-token"; // Development environment

// Backend API URL
const API_URL = process.env.API_URL || "http://localhost:8000";

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: API_URL,
  async auth() {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value;
  },
});
```

**Important**: `cookies()` is imported from `next/headers`, so this only works **server-side**:

- Server Components
- Server Actions
- Route Handlers

### 4. NPM Script Added

```json
{
  "scripts": {
    "generate:openapi-ts": "openapi-ts"
  }
}
```

### 5. `.gitignore` Updated

The generated folder is excluded from version control:

```gitignore
# OpenAPI Generated Client
/generated/
```

---

## API Wrapper: `lib/api.ts`

The generated SDK functions have complex names. The wrapper provides simple, intuitive names:

### Feeds API

| Generated Function           | Wrapper Function | Description            |
| ---------------------------- | ---------------- | ---------------------- |
| `getFeedsApiV1FeedsGet`      | `getFeedList`    | Get list of news feeds |
| `getFeedApiV1FeedsFeedIdGet` | `getFeed`        | Get single feed by ID  |

### Agent API

| Generated Function                                         | Wrapper Function         | Description                    |
| ---------------------------------------------------------- | ------------------------ | ------------------------------ |
| `startInvestigationApiV1AgentInvestigatePost`              | `startInvestigation`     | Start autonomous investigation |
| `getInvestigationStatusApiV1AgentStatusInvestigationIdGet` | `getInvestigationStatus` | Get investigation status       |
| `triggerScanApiV1AgentScanPost`                            | `triggerScan`            | Trigger multi-source scan      |
| `listInvestigationsApiV1AgentInvestigationsGet`            | `listInvestigations`     | List recent investigations     |

### Posts API

| Generated Function                                      | Wrapper Function      | Auth     | Description               |
| ------------------------------------------------------- | --------------------- | -------- | ------------------------- |
| `listPostsApiV1PostsGet`                                | `getPostList`         | -        | Get list of posts         |
| `getPostApiV1PostsPostIdGet`                            | `getPost`             | -        | Get single post           |
| `createPostApiV1PostsPost`                              | `createPost`          | Required | Create new post           |
| `updatePostApiV1PostsPostIdPatch`                       | `updatePost`          | Required | Update post (author only) |
| `deletePostApiV1PostsPostIdDelete`                      | `deletePost`          | Required | Soft delete (author only) |
| `hardDeletePostApiV1PostsPostIdHardDelete`              | `hardDeletePost`      | Admin    | Hard delete               |
| `likePostApiV1PostsPostIdLikePost`                      | `likePost`            | Required | Like a post               |
| `unlikePostApiV1PostsPostIdLikeDelete`                  | `unlikePost`          | Required | Unlike a post             |
| `getPostLikersApiV1PostsPostIdLikesGet`                 | `getPostLikers`       | -        | Get users who liked       |
| `addMediaToPostApiV1PostsPostIdMediaPost`               | `addMediaToPost`      | Required | Add media to post         |
| `deleteMediaFromPostApiV1PostsPostIdMediaMediaIdDelete` | `deleteMediaFromPost` | Required | Delete media              |

### Comments API

| Generated Function                            | Wrapper Function    | Auth     | Description          |
| --------------------------------------------- | ------------------- | -------- | -------------------- |
| `listCommentsFlatApiV1CommentsGet`            | `getCommentList`    | -        | Get comments (flat)  |
| `listCommentsTreeApiV1CommentsTreeGet`        | `getCommentTree`    | -        | Get comments (tree)  |
| `getCommentApiV1CommentsCommentIdGet`         | `getComment`        | -        | Get single comment   |
| `createCommentApiV1CommentsPost`              | `createComment`     | Required | Create comment/reply |
| `updateCommentApiV1CommentsCommentIdPatch`    | `updateComment`     | Required | Update comment       |
| `deleteCommentApiV1CommentsCommentIdDelete`   | `deleteComment`     | Required | Delete comment       |
| `listRepliesApiV1CommentsCommentIdRepliesGet` | `getCommentReplies` | -        | Get replies          |

### Media API

| Generated Function                               | Wrapper Function       | Auth     | Description       |
| ------------------------------------------------ | ---------------------- | -------- | ----------------- |
| `getMediaConfigApiV1MediaConfigGet`              | `getMediaConfig`       | -        | Get upload config |
| `generatePresignedUrlApiV1MediaPresignedUrlPost` | `generatePresignedUrl` | Required | Get S3 upload URL |

### Health API

| Generated Function     | Wrapper Function | Description  |
| ---------------------- | ---------------- | ------------ |
| `healthCheckHealthGet` | `healthCheck`    | Health check |

---

## How to Use

### Generate the Client

First, ensure the backend server is running:

```bash
# In the backend folder
uv run uvicorn app.main:app --reload
```

Then generate the client:

```bash
cd client
npm run generate:openapi-ts
```

### Use in Server Components

```typescript
// app/posts/page.tsx
import { getPostList } from "@/lib/api";

export default async function PostsPage() {
  const { data, error } = await getPostList(20, 0);

  if (error) {
    return <div>Error: {error.detail}</div>;
  }

  return (
    <ul>
      {data.items.map((post) => (
        <li key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </li>
      ))}
    </ul>
  );
}
```

### Use in Server Actions

```typescript
// app/actions/posts.ts
"use server";

import { createPost } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function createPostAction(formData: FormData) {
  const { data, error } = await createPost({
    title: formData.get("title") as string,
    content: formData.get("content") as string,
  });

  if (error) {
    return { error: error.detail };
  }

  revalidatePath("/posts");
  return { data };
}
```

### Use in Client Components (via Server Actions)

```typescript
// components/post-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { createPostAction } from "@/app/actions/posts";
import { toast } from "sonner";

export function PostForm() {
  const form = useForm();

  const onSubmit = async (formData: FormData) => {
    const result = await createPostAction(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Post created successfully");
    }
  };

  return (
    <form action={onSubmit}>
      {/* form fields */}
    </form>
  );
}
```

---

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                  Authentication Flow                                      │
└──────────────────────────────────────────────────────────────────────────────────────────┘

  [1] User Login (NextAuth)
      NextAuth handles OAuth login and stores JWE token in cookie
      Cookie: authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLi4u
                                            │
                                            ▼
  [2] Token Auto-Extraction on API Call
      config/openapi-runtime.ts
      async auth() {
        const cookieStore = await cookies();
        return cookieStore.get("authjs.session-token")?.value;
      }
                                            │
                                            ▼
  [3] HTTP Request with Bearer Token
      POST /api/v1/posts HTTP/1.1
      Authorization: Bearer eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLi4u
      Content-Type: application/json
                                            │
                                            ▼
  [4] Backend Token Verification
      1. Extract token from Authorization header
      2. Decrypt JWE (using AUTH_SECRET)
      3. Verify JWT (signature, expiration)
      4. Extract user_id
      5. Pass CurrentUser object to controller
```

---

## Error Handling

### Basic Pattern

```typescript
const { data, error } = await getPost(postId);

if (error) {
  // error type is auto-inferred
  console.error(error.detail);
  return;
}

// data type is auto-inferred as PostResponse
console.log(data.title);
```

### Error Response Types

```typescript
// 401 Unauthorized
{
  detail: "Not authenticated";
}

// 403 Forbidden
{
  detail: "Not enough permissions";
}

// 404 Not Found
{
  detail: "Post not found";
}

// 422 Validation Error
{
  detail: [
    {
      loc: ["body", "title"],
      msg: "field required",
      type: "value_error.missing",
    },
  ];
}
```

---

## Important Notes

### 1. Server-Only

`lib/api.ts` **cannot be used directly in Client Components**.

```typescript
// ❌ Wrong
"use client";
import { getPostList } from "@/lib/api";

export function PostList() {
  useEffect(() => {
    getPostList(); // Error!
  }, []);
}

// ✅ Correct
("use client");
import { getPostsAction } from "@/app/actions/posts";

export function PostList() {
  useEffect(() => {
    getPostsAction(); // Via Server Action
  }, []);
}
```

### 2. Do Not Modify Generated Files

Files in `generated/openapi-client/` are overwritten on regeneration.
For customization, modify wrapper functions in `lib/api.ts`.

### 3. Regenerate When Backend Changes

```bash
npm run generate:openapi-ts
```

Run this whenever:

- Backend API endpoints are added/modified/deleted
- Request/Response schemas change
- New error types are added

---

## Troubleshooting

### "cookies() can only be called in Server Components"

You're calling `lib/api.ts` directly from a Client Component.
→ Use a Server Action instead.

### Type Mismatch

Backend schema may have changed.
→ Run `npm run generate:openapi-ts`

### Authentication Failure (401)

1. Check cookie name:
   - Development: `authjs.session-token`
   - Production: `__Secure-authjs.session-token`
2. Verify backend `AUTH_SECRET` environment variable
3. Check if token is expired

---

## Environment Variables

Add to `.env`:

```bash
# Backend API URL (default: http://localhost:8000)
API_URL=http://localhost:8000
```
