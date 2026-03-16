# Server Actions vs React Query — 데이터 페칭 비교

## 개요

현재 Grapoll 프론트엔드는 **Server Actions**를 통해 모든 데이터를 페칭합니다.
이 문서는 현재 방식과 **React Query (TanStack Query)** 도입 시의 차이를 분석하고,
어떤 방식이 더 효율적인지 비교합니다.

---

## 현재 아키텍처

### 데이터 흐름

```
[Server Component에서 초기 로드]
  page.tsx (Server Component)
    → Server Action (queries.ts)
      → apiFetch() / OpenAPI client (lib/api.ts)
        → FastAPI 백엔드 (port 8000)

[Client Component에서 리페치 (필터, 검색, 무한스크롤)]
  Client Component (polls-all-client.tsx)
    → useState + useEffect
      → Server Action (queries.ts)    ← Next.js 서버를 거침
        → apiFetch()
          → FastAPI 백엔드
```

### 핵심 파일

| 파일                                        | 역할                                                     |
| ------------------------------------------- | -------------------------------------------------------- |
| `app/(main)/page.tsx`                       | Server Component에서 Server Action 호출 (SSR)            |
| `app/actions/polls/queries.ts`              | Server Action — 백엔드 API 호출 래퍼                     |
| `app/actions/polls/mutations.ts`            | Server Action — 변경 + `updateTag()` 캐시 무효화         |
| `lib/api.ts`                                | HTTP 클라이언트 — `apiFetch()` + OpenAPI 생성 클라이언트 |
| `components/polls/all/polls-all-client.tsx` | Client Component — `useState` + `useEffect`로 리페치     |

### SSR 데이터 로드 (Server Component)

```typescript
// app/(main)/page.tsx
export const revalidate = 60;

export default async function HomePage() {
  const [polls, hotDebate, suggested] = await Promise.all([
    getPollFeed("popular"),
    getHotDebate(),
    getSuggestedPolls(),
  ]);
  return <PollsHomeClient polls={polls} hotDebate={hotDebate} suggested={suggested} />;
}
```

### Client Component에서 리페치

```typescript
// components/polls/all/polls-all-client.tsx
const [polls, setPolls] = useState<PollCardData[]>(initialPolls);
const [loading, setLoading] = useState(false);
const [hasMore, setHasMore] = useState(initialPolls.length >= PAGE_SIZE);
const offsetRef = useRef(initialPolls.length);
const isInitialMount = useRef(true);

// 필터 변경 시 리페치
useEffect(() => {
  if (isInitialMount.current) {
    isInitialMount.current = false;
    return;
  }
  let cancelled = false;
  const doFetch = async () => {
    setLoading(true);
    const data = await getPollFeed(sortType, debouncedSearch || undefined, PAGE_SIZE, 0);
    if (cancelled) return;
    setPolls(data);
    setHasMore(data.length >= PAGE_SIZE);
    offsetRef.current = data.length;
    setLoading(false);
  };
  doFetch();
  return () => {
    cancelled = true;
  };
}, [sortType, debouncedSearch]);

// 무한 스크롤
const loadMore = useCallback(async () => {
  if (loading || !hasMore) return;
  setLoading(true);
  const data = await getPollFeed(
    sortType,
    debouncedSearch || undefined,
    PAGE_SIZE,
    offsetRef.current
  );
  setPolls((prev) => [...prev, ...data]);
  setHasMore(data.length >= PAGE_SIZE);
  offsetRef.current = offsetRef.current + data.length;
  setLoading(false);
}, [loading, hasMore, sortType, debouncedSearch]);
```

### Mutation + 캐시 무효화

```typescript
// app/actions/polls/mutations.ts
export async function castVote(dto) {
  const { error, status } = await apiCastVote(dto.pollId, { ... });
  if (error) return { error: getVoteErrorMessage(status, error), status };

  updateTag(`poll-${dto.pollId}`);   // 특정 poll 캐시 무효화
  updateTag("polls");                // 전체 목록 캐시 무효화
  return {};
}
```

---

## React Query 도입 시 아키텍처

### 데이터 흐름

```
[Server Component에서 초기 로드]
  page.tsx (Server Component)
    → prefetch + dehydrate (변동 없음)

[Client Component에서 리페치]
  Client Component
    → useQuery() / useInfiniteQuery()
      → fetch()    ← 브라우저에서 직접 또는 Next.js 프록시 경유
        → FastAPI 백엔드
```

### 같은 컴포넌트의 React Query 버전

```typescript
// React Query 사용 시 — polls-all-client.tsx 동일 기능
const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery({
  queryKey: ["polls", sortType, debouncedSearch],
  queryFn: ({ pageParam = 0 }) =>
    fetch(`/api/proxy/v1/polls?sort=${sortType}&offset=${pageParam}&limit=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((res) => res.items),
  getNextPageParam: (lastPage, allPages) =>
    lastPage.length >= PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
});

const polls = data?.pages.flat() ?? [];
```

---

## 비교

### 1. SSR / 초기 페이지 로드

|            | Server Actions (현재)             | React Query                                    |
| ---------- | --------------------------------- | ---------------------------------------------- |
| **구현**   | Server Component에서 `await` 호출 | prefetch + dehydrate 설정 필요                 |
| **성능**   | 동일                              | 동일                                           |
| **코드량** | 간결                              | 추가 boilerplate (HydrationBoundary, prefetch) |

초기 로드는 **두 방식 모두 동일한 성능**입니다.
React Query는 오히려 `HydrationBoundary`, `QueryClientProvider`, `dehydrate` 등 추가 설정이 필요합니다.

**현재 방식이 더 간결합니다.**

### 2. Client Component 리페치 (필터, 검색, 무한스크롤)

이 부분이 **가장 큰 차이**가 나는 영역입니다.

|                        | Server Actions (현재)                                                      | React Query                               |
| ---------------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| **Boilerplate**        | `useState` + `useEffect` + `useRef` + cancelled 플래그 (컴포넌트마다 반복) | 선언적 `useQuery` / `useInfiniteQuery`    |
| **Race condition**     | 수동 `cancelled` 플래그 필요                                               | 자동 취소                                 |
| **Loading/Error 상태** | 수동 `setLoading`, 수동 에러 처리                                          | 내장 `isLoading`, `isError`, `error`      |
| **무한 스크롤**        | 수동 `offsetRef` + IntersectionObserver                                    | 내장 `useInfiniteQuery` + `fetchNextPage` |
| **코드량**             | ~40줄 (상태관리 + useEffect + loadMore)                                    | ~10줄 (`useInfiniteQuery` 선언)           |

현재 `polls-all-client.tsx`는 리페치를 위해 **5개의 useState/useRef**를 관리합니다:

```
useState: polls, loading, sortType, searchQuery, debouncedSearch, categoryFilter
useRef: offsetRef, observerRef, loadMoreRef, isInitialMount
```

React Query는 이를 하나의 `useInfiniteQuery`로 대체합니다.

**React Query가 훨씬 간결하고 안전합니다.**

### 3. 네트워크 경로 (레이턴시)

```
현재 (Client Component에서 Server Action 호출 시):
  Browser → Next.js Server → FastAPI → Next.js Server → Browser
  = 2 네트워크 홉

React Query (직접 페칭 또는 프록시 경유):
  Browser → (Next.js 프록시 →) FastAPI → (→ Next.js 프록시) → Browser
  = 1~2 네트워크 홉
```

Client Component에서 Server Action을 호출하면, 요청이 **항상 Next.js 서버를 경유**합니다.
필터 변경, 무한 스크롤 등 빈번한 인터랙션에서 매번 불필요한 홉이 추가됩니다.

**단, 직접 브라우저→FastAPI 통신에는 제약이 있습니다:**

현재 JWT가 `localhost:3000` 도메인의 httpOnly 쿠키에 저장되어 있어,
`localhost:8000`으로 직접 요청 시 쿠키가 전송되지 않습니다.
해결 방법:

- Next.js API 프록시 라우트 (`/api/proxy/[...path]`) 사용
- 또는 쿠키 도메인을 두 origin 모두 커버하도록 변경

### 4. 클라이언트 측 캐싱

|                            | Server Actions (현재)                                | React Query                                      |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| **클라이언트 캐시**        | 없음 — 매 리페치마다 새 요청                         | 인메모리 캐시 (`staleTime`, `gcTime`)            |
| **요청 중복 제거**         | 없음 — 같은 데이터를 두 컴포넌트가 요청하면 2번 호출 | 자동 — 같은 `queryKey`면 캐시 공유               |
| **백그라운드 갱신**        | 없음                                                 | `refetchOnWindowFocus`, `refetchInterval`        |
| **Stale-While-Revalidate** | 없음                                                 | 내장 — 캐시된 데이터 즉시 표시 + 백그라운드 갱신 |

현재 두 컴포넌트가 동시에 `getPollFeed("popular")`를 호출하면 FastAPI 서버에 **2번 요청**이 갑니다.
React Query는 자동으로 **중복 제거**합니다.

**React Query가 네트워크 효율성에서 우위입니다.**

### 5. Mutation + 캐시 무효화

|                            | Server Actions + `updateTag()` (현재)                             | React Query `useMutation`           |
| -------------------------- | ----------------------------------------------------------------- | ----------------------------------- |
| **서버 캐시 무효화**       | `updateTag()`로 ISR 캐시를 **전역 무효화** (모든 사용자에게 적용) | 해당 없음 (클라이언트 캐시만)       |
| **클라이언트 캐시 무효화** | 페이지 리로드 또는 수동 리페치 필요                               | `invalidateQueries()`로 자동 리페치 |
| **Optimistic Update**      | 수동 구현 필요                                                    | `onMutate` + 자동 롤백 내장         |

`updateTag()`는 **Next.js 서버의 ISR 캐시를 전역으로 무효화**합니다.
투표 후 다른 사용자도 새로고침하면 업데이트된 데이터를 볼 수 있습니다.
React Query의 `invalidateQueries`는 **현재 브라우저 탭의 캐시만** 무효화합니다.

**서로 다른 문제를 해결하므로, 두 방식은 보완적입니다.**

### 6. 번들 사이즈

|               | Server Actions (현재) | React Query             |
| ------------- | --------------------- | ----------------------- |
| **추가 번들** | 0 (서버에서 실행)     | ~13KB gzipped           |
| **의존성**    | 없음                  | `@tanstack/react-query` |

### 7. 에러 핸들링

|               | Server Actions (현재)                        | React Query                             |
| ------------- | -------------------------------------------- | --------------------------------------- |
| **에러 처리** | 각 Server Action에서 try/catch + 기본값 반환 | 전역 `onError` 또는 `queryFn`에서 throw |
| **재시도**    | 없음                                         | 내장 `retry` (기본 3회)                 |
| **에러 표시** | 수동 toast                                   | `isError` + `error` 상태로 선언적 처리  |

---

## 결론

### 하이브리드 방식을 추천

**완전한 전환이 아닌, 용도에 따른 하이브리드 방식이 가장 효율적입니다.**

```
유지 (Server Actions):
├── SSR 초기 로드        → Server Component에서 await 호출
├── Mutations            → updateTag()로 전역 ISR 캐시 무효화
└── 서버 측 인증 확인    → httpOnly 쿠키 직접 접근

추가 (React Query):
├── 무한 스크롤          → useInfiniteQuery
├── 필터/검색 리페치     → useQuery + queryKey 변경
├── 클라이언트 캐시      → 중복 요청 제거, stale-while-revalidate
└── Optimistic Updates   → useMutation + onMutate
```

### 이유

1. **SSR + `updateTag()`는 유지해야 합니다**
   - 초기 로드에서 Server Action은 간결하고 효율적
   - `updateTag()`는 전역 ISR 캐시 무효화 (React Query로 대체 불가)

2. **Client Component 리페치에서만 React Query를 도입합니다**
   - `polls-all-client.tsx`의 40줄 상태관리 → 10줄 `useInfiniteQuery`
   - Race condition, 로딩 상태, 에러 핸들링이 자동화
   - 클라이언트 캐시 + 요청 중복 제거로 네트워크 효율 개선

3. **인증 문제는 Next.js 프록시로 해결합니다**
   - `/api/proxy/[...path]` 라우트를 추가하여 쿠키를 자동 전달
   - React Query의 `queryFn`에서 프록시 URL로 요청

### 하이브리드 적용 후 아키텍처

```
[초기 로드 — 변동 없음]
  page.tsx (Server Component)
    → Server Action → apiFetch() → FastAPI

[클라이언트 리페치 — React Query 도입]
  Client Component
    → useQuery() / useInfiniteQuery()
      → fetch("/api/proxy/v1/polls?...") → FastAPI

[Mutations — 변동 없음]
  Client Component
    → Server Action (mutations.ts)
      → apiFetch() → FastAPI
      → updateTag() (전역 ISR 캐시 무효화)
      → queryClient.invalidateQueries() (클라이언트 캐시도 무효화)
```

### 도입 시 영향받는 컴포넌트

| 컴포넌트                          | 현재                                   | React Query 도입 후            |
| --------------------------------- | -------------------------------------- | ------------------------------ |
| `polls-all-client.tsx`            | useState x6 + useRef x4 + useEffect x3 | `useInfiniteQuery` 1개         |
| `community/community-section.tsx` | 유사한 수동 페이징                     | `useInfiniteQuery` 1개         |
| `poll-detail-client.tsx`          | SSR 데이터 + mutation 후 수동 갱신     | SSR 유지 + `invalidateQueries` |

### 도입하지 않아도 되는 부분

| 부분                           | 이유                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| `page.tsx` (Server Components) | Server Action + ISR이 이미 최적                            |
| `mutations.ts`                 | `updateTag()`의 전역 캐시 무효화는 React Query로 대체 불가 |
| 인증 상태 관리                 | `AuthProvider` + `useAuth()`가 이미 충분                   |
