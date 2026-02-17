# OAuth Authentication Implementation - Frontend (Next.js)

이 문서는 OAuth 2.0 Authorization Code Flow가 프론트엔드에서 어떻게 구현되었는지 설명합니다.

인증의 핵심 로직(코드 교환, 토큰 발급, 사용자 생성)은 모두 FastAPI 백엔드에서 처리됩니다. 프론트엔드는 OAuth 리다이렉트 흐름을 조율하고, 백엔드가 발급한 JWT를 쿠키로 관리합니다.

```
사용자          서비스 Client         Authorization Server       Resource Server
  │                │                        │                        │
  │  1. 서비스 접근  │                        │                        │
  │───────────────>│                        │                        │
  │  2. Client ID, │                        │                        │
  │  Redirect_URI  │                        │                        │
  │<───────────────│                        │                        │
  │                │  3. 로그인 페이지 요청    │                        │
  │                │  Client ID, Redirect URI│                        │
  │────────────────────────────────────────>│                        │
  │  4. 로그인 페이지│                        │                        │
  │<────────────────────────────────────────│                        │
  │  5. ID/PW 입력  │                        │                        │
  │────────────────────────────────────────>│                        │
  │  6. Authorization code 발급              │                        │
  │<────────────────────────────────────────│                        │
  │  7. Redirect_URI로                      │                        │
  │  Authorization code 전달                 │                        │
  │───────────────>│                        │                        │
  │                │  8. Authorization code로 │                        │
  │                │  Access Token 요청       │                        │
  │                │───────────────────────>│                        │
  │                │  9. Access Token 발급    │                        │
  │                │<───────────────────────│                        │
  │ 10. 인증 완료   │                        │                        │
  │<───────────────│                        │                        │
  │ 11. 서비스 요청  │                        │                        │
  │───────────────>│                        │                        │
  │                │  12. Access Token으로    │                        │
  │                │  API 호출               │                        │
  │                │────────────────────────────────────────────────>│
  │                │  13. 검증 및 서비스 제공   │                        │
  │                │<────────────────────────────────────────────────│
  │ 14. 서비스 제공  │                        │                        │
  │<───────────────│                        │                        │
```

---

## Phase 1: 서비스 접근 및 이용 시도

**사용자가 앱에 접속합니다. 인증 상태에 따라 UI가 달라집니다.**

### 구현 위치

**MainHeader**: `components/layout/main-header.tsx`

```tsx
import { useAuth } from "@/lib/auth/auth-context";

export function MainHeader() {
  const { status } = useAuth();

  return (
    <>
      {status === "authenticated" ? (
        <Link href="/profile">마이페이지</Link>
      ) : status === "unauthenticated" ? (
        <Link href="/auth/signin">로그인</Link>
      ) : null}
    </>
  );
}
```

`useAuth()` 훅은 `AuthProvider`가 마운트 시 `GET /api/auth/me`를 호출하여 현재 인증 상태를 확인합니다.

---

## Phase 2: Client ID, Redirect_URI 전달

**사용자가 로그인 버튼을 클릭하면, OAuth Provider의 인증 페이지로 리다이렉트됩니다.**

### 구현 위치

**OAuthButton**: `components/auth/oauth-button.tsx`

```tsx
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

**Server Action**: `app/actions/auth.ts`

```typescript
export async function signInWithOAuth(provider: "google" | "kakao", callbackUrl = "/") {
  // 백엔드에서 OAuth 인증 URL 요청
  const res = await fetch(`${API_BASE}/api/v1/auth/oauth/${provider}/authorize?redirect_uri=...`);
  const data = await res.json();

  // Provider 인증 페이지로 리다이렉트
  redirect(data.url);
}
```

이 과정에서:

1. Server Action이 백엔드 `GET /api/v1/auth/oauth/{provider}/authorize`를 호출
2. 백엔드가 Authlib로 인증 URL 생성 (client_id, redirect_uri, scope, state 포함)
3. 사용자 브라우저를 해당 URL로 리다이렉트

### Login Modal (컨텍스트 기반)

**위치**: `components/auth/login-modal.tsx`

페이지 이동 없이 어디서든 로그인 모달을 띄울 수 있습니다:

```tsx
const { openLoginModal } = useLoginModal();
openLoginModal("투표하려면 로그인이 필요합니다.");
```

모달은 `OAuthButton`을 렌더링하고, 현재 `pathname`을 `callbackUrl`로 전달합니다.

---

## Phase 3-6: 로그인 페이지 → Authorization Code 발급

**이 단계들은 OAuth Provider(Google, Kakao)가 직접 처리합니다.**

사용자가 Google/Kakao 로그인 페이지에서 계정을 선택하고 권한을 부여하면, Provider가 Authorization Code를 생성하여 `redirect_uri`로 리다이렉트합니다.

프론트엔드는 이 과정에 관여하지 않습니다.

---

## Phase 7: Redirect_URI로 Authorization Code 전달

**Provider가 Authorization Code와 함께 프론트엔드의 callback URL로 리다이렉트합니다.**

### Callback URL 형식

```
GET /api/auth/callback/{provider}?code=xxx&state=xxx&callbackUrl=/
```

### 구현 위치

**Route Handler**: `app/api/auth/callback/[provider]/route.ts`

```typescript
export async function GET(request: NextRequest, { params }) {
  const { provider } = await params;
  const code = searchParams.get("code");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Phase 8-9: 백엔드에 Authorization Code 전달
  const res = await fetch(
    `${API_BASE}/api/v1/auth/oauth/${provider}/callback`,
    {
      method: "POST",
      body: JSON.stringify({
        code,
        state,
        redirect_uri: redirectUri,
      }),
    }
  );

  const data = await res.json();
  // data = { access_token, refresh_token, user }
```

---

## Phase 8-9: Authorization Code → Access Token 교환

**프론트엔드의 callback route handler가 백엔드에 Authorization Code를 전달합니다.**

백엔드가 처리하는 내용:

1. Authorization Code를 Provider의 Token Endpoint에 전송
2. Provider가 Access Token 발급
3. Access Token으로 Provider의 Resource Server에서 사용자 프로필 조회
4. 사용자 생성/조회
5. 자체 JWT(Access Token + Refresh Token) 발급

프론트엔드는 백엔드의 응답에서 토큰을 받아 쿠키로 저장합니다.

---

## Phase 10: 인증 완료 및 로그인 성공

**백엔드가 반환한 토큰을 HTTP-only 쿠키에 저장하고, 사용자를 원래 페이지로 리다이렉트합니다.**

### 구현 위치

**Route Handler**: `app/api/auth/callback/[provider]/route.ts`

```typescript
// 토큰을 HTTP-only 쿠키로 설정
const response = NextResponse.redirect(new URL(callbackUrl, FRONTEND_URL));

response.cookies.set("grapoll-access-token", data.access_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 30 * 60, // 30분
});

response.cookies.set("grapoll-refresh-token", data.refresh_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 30 * 24 * 60 * 60, // 30일
});

return response;
```

### 쿠키 이름

| 환경        | Access Token                    | Refresh Token                    |
| ----------- | ------------------------------- | -------------------------------- |
| Development | `grapoll-access-token`          | `grapoll-refresh-token`          |
| Production  | `__Secure-grapoll-access-token` | `__Secure-grapoll-refresh-token` |

---

## Phase 11-14: 인증된 서비스 요청

**사용자가 인증된 상태에서 서비스를 이용합니다.**

### Client-Side: AuthProvider & useAuth()

**위치**: `lib/auth/auth-context.tsx`

```tsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    // GET /api/auth/me → 현재 사용자 정보 조회
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setStatus(data ? "authenticated" : "unauthenticated");
      });
  }, []);

  return <AuthContext.Provider value={{ user, status, logout }}>{children}</AuthContext.Provider>;
}
```

### Server-Side: auth() 함수

**위치**: `lib/auth/session.ts`

Server Component와 Server Action에서 사용합니다:

```typescript
export async function auth(): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) return null;

  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return { user: { id: data.id, email: data.email, ... } };
}
```

### 사용 예시

**Server Component**:

```tsx
import { auth } from "@/lib/auth";

export default async function PollPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  // ...
}
```

**Client Component**:

```tsx
import { useAuth } from "@/lib/auth/auth-context";

export function VoteButton() {
  const { user, status } = useAuth();

  if (status !== "authenticated") {
    openLoginModal("투표하려면 로그인이 필요합니다.");
    return;
  }
  // ...
}
```

### API 호출 시 토큰 전달

**위치**: `lib/api.ts`

Server Action에서 백엔드 API 호출 시, 쿠키에서 Access Token을 읽어 Bearer 헤더로 전달합니다:

```typescript
async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("grapoll-access-token")?.value ?? null;
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

---

## Token Refresh (자동 갱신)

**Access Token이 만료(30분)되면, Refresh Token으로 자동 갱신됩니다.**

### 구현 위치

**Route Handler**: `app/api/auth/me/route.ts`

`GET /api/auth/me` 핸들러가 자동 갱신을 담당합니다:

1. Access Token으로 백엔드 `/auth/me` 호출
2. 실패 시(401) → Refresh Token으로 백엔드 `/auth/refresh` 호출
3. 새 Access Token을 쿠키에 저장
4. 새 Access Token으로 `/auth/me` 재시도

```typescript
// Access Token 만료 시 Refresh 시도
const refreshRes = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
  method: "POST",
  body: JSON.stringify({ refresh_token: refreshToken }),
});

const { access_token } = await refreshRes.json();

// 새 Access Token을 쿠키에 저장
response.cookies.set("grapoll-access-token", access_token, {
  httpOnly: true,
  maxAge: 30 * 60,
});
```

---

## Logout (로그아웃)

### 구현 위치

**Route Handler**: `app/api/auth/logout/route.ts`

```typescript
export async function POST() {
  // 1. 백엔드에 Refresh Token 폐기 요청
  await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  // 2. 쿠키 삭제
  response.cookies.delete("grapoll-access-token");
  response.cookies.delete("grapoll-refresh-token");
}
```

**Client Component**: `components/profile/profile-client.tsx`

```tsx
const { logout } = useAuth();

<Button
  onClick={() => {
    logout();
    window.location.href = "/";
  }}
>
  로그아웃
</Button>;
```

---

## Route Protection (라우트 보호)

**위치**: `proxy.ts`

인증이 필요한 페이지에 대한 접근 제어:

```typescript
export default async function proxy(request: NextRequest) {
  const hasAccessToken = !!request.cookies.get("grapoll-access-token")?.value;
  const hasRefreshToken = !!request.cookies.get("grapoll-refresh-token")?.value;
  const isLoggedIn = hasAccessToken || hasRefreshToken;

  // /profile → 미인증 시 /auth/signin으로 리다이렉트
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect("/auth/signin?callbackUrl=...");
  }

  // /auth/signin → 이미 인증 시 홈으로 리다이렉트
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect("/");
  }
}
```

---

## Protected Server Actions (withAuth HOF)

**위치**: `lib/auth/with-auth.ts`

Server Action에 인증을 추가하는 Higher-Order Function:

```typescript
export function withAuth<TArgs, TResult>(
  action: (ctx: AuthContext, ...args: TArgs[]) => Promise<ActionResult<TResult>>
) {
  return async (...args) => {
    const user = await getServerSession(); // 쿠키 → 백엔드 /auth/me

    if (!user?.id) {
      return { error: "인증이 필요합니다" };
    }

    return action({ user }, ...args);
  };
}
```

---

## 파일 구조

```
client/
├── app/
│   ├── api/auth/
│   │   ├── callback/[provider]/route.ts   # OAuth 콜백 (코드 수신 → 백엔드 전달 → 쿠키 저장)
│   │   ├── me/route.ts                    # 현재 사용자 조회 (토큰 자동 갱신 포함)
│   │   └── logout/route.ts               # 로그아웃 (쿠키 삭제 + 백엔드 토큰 폐기)
│   ├── auth/
│   │   └── signin/page.tsx               # 로그인 페이지 (OAuthButton 렌더링)
│   ├── actions/
│   │   └── auth.ts                       # signInWithOAuth() Server Action
│   └── providers.tsx                     # AuthProvider + LoginModalProvider
│
├── components/auth/
│   ├── oauth-button.tsx                  # OAuth 로그인 버튼 (Google, Kakao)
│   └── login-modal.tsx                   # 컨텍스트 기반 로그인 모달
│
├── lib/auth/
│   ├── auth-context.tsx                  # AuthProvider + useAuth() 훅
│   ├── session.ts                        # Server-side auth() 함수
│   ├── with-auth.ts                      # 인증 HOF for Server Actions
│   └── index.ts                          # Re-exports
│
├── lib/
│   └── api.ts                            # 백엔드 API 클라이언트 (Bearer 토큰 전달)
│
└── proxy.ts                              # 라우트 보호 (쿠키 존재 여부 확인)
```
