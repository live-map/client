# Infinite Pagination Implementation - 커뮤니티 게시글

이 문서는 커뮤니티 게시글 목록에서 무한 스크롤(Infinite Scroll)이 어떻게 구현되었는지 설명합니다.

사용자가 게시글 목록을 아래로 스크롤하면, 새로운 게시글이 자동으로 로드됩니다. 이 구현은 Offset 기반 페이지네이션 + IntersectionObserver API를 조합하여 구현되었습니다.

### 전체 흐름 다이어그램

```
Browser (React)              Next.js Server Action           FastAPI Backend            PostgreSQL
  │                               │                              │                        │
  │  1. 페이지 접속                 │                              │                        │
  │  (Server Component 렌더)       │                              │                        │
  │──────────────────────────────>│                              │                        │
  │                               │  2. getPostList(20, 0,       │                        │
  │                               │     "popular")               │                        │
  │                               │  GET /api/v1/posts?          │                        │
  │                               │  limit=20&offset=0&          │                        │
  │                               │  sort=popular                │                        │
  │                               │─────────────────────────────>│                        │
  │                               │                              │  3. SELECT * FROM posts │
  │                               │                              │  WHERE is_deleted=false │
  │                               │                              │  ORDER BY popularity    │
  │                               │                              │  LIMIT 20 OFFSET 0     │
  │                               │                              │─────────────────────────>
  │                               │                              │  4. 결과 반환            │
  │                               │                              │<─────────────────────────
  │                               │  5. { items: [...20개],       │                        │
  │                               │     total: 150 }             │                        │
  │                               │<─────────────────────────────│                        │
  │  6. 초기 20개 게시글 렌더        │                              │                        │
  │  + IntersectionObserver 설정   │                              │                        │
  │<──────────────────────────────│                              │                        │
  │                               │                              │                        │
  │  === 사용자가 하단까지 스크롤 ===  │                              │                        │
  │                               │                              │                        │
  │  7. IntersectionObserver       │                              │                        │
  │  트리거 (sentinel 요소 감지)     │                              │                        │
  │                               │                              │                        │
  │  8. loadMore() 호출            │                              │                        │
  │──────────────────────────────>│  9. getPostList(20, 20,      │                        │
  │                               │     "popular")               │                        │
  │                               │  GET /api/v1/posts?          │                        │
  │                               │  limit=20&offset=20          │                        │
  │                               │─────────────────────────────>│                        │
  │                               │                              │  10. LIMIT 20 OFFSET 20│
  │                               │                              │─────────────────────────>
  │                               │                              │  11. 결과 반환           │
  │                               │                              │<─────────────────────────
  │                               │  12. { items: [...20개],      │                        │
  │                               │      total: 150 }            │                        │
  │                               │<─────────────────────────────│                        │
  │  13. 기존 목록에 20개 추가       │                              │                        │
  │  (총 40개 표시)                 │                              │                        │
  │<──────────────────────────────│                              │                        │
  │                               │                              │                        │
  │  === offset >= total이면 ===   │                              │                        │
  │  hasMore = false → 스크롤 중지  │                              │                        │
```

---

## Phase 1: 서버에서 초기 데이터 로드

**페이지에 처음 접속하면, Server Component가 첫 20개 게시글을 미리 가져옵니다.**

### 구현 위치

**Server Component**: `app/(main)/community/page.tsx`

```tsx
// Next.js에게 이 페이지는 항상 동적으로 렌더하라고 지시 (캐시 사용 안 함)
export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  // Server Component에서 직접 백엔드 API 호출 (첫 20개, offset 0, 인기순 정렬)
  const { data } = await getPostList(20, 0, "popular");

  // 클라이언트 컴포넌트에 초기 데이터를 props로 전달
  // data가 null일 수 있으므로 ?? 연산자로 빈 배열/0 기본값 설정
  return <CommunitySection initialPosts={data?.items ?? []} initialTotal={data?.total ?? 0} />;
}
```

`force-dynamic`으로 설정하여 매 요청마다 최신 게시글을 가져옵니다. Server Component에서 데이터를 가져오므로, 클라이언트에 도달하기 전에 이미 첫 페이지가 준비되어 있습니다 (SSR 이점).

---

## Phase 2: 클라이언트 상태 초기화

**서버에서 받은 데이터로 클라이언트 컴포넌트의 초기 상태를 설정합니다.**

### 구현 위치

**Client Component**: `components/community/community-section.tsx`

```tsx
// 한 번에 가져올 게시글 수 (페이지 크기)
const PAGE_SIZE = 20;

export function CommunitySection({ initialPosts, initialTotal }: CommunitySectionProps) {
  // 현재 선택된 정렬 기준 (인기, 최신, 조회, 추천, 일간/주간/월간 인기)
  const [sortType, setSortType] = useState<SortType>("popular");

  // 현재까지 로드된 모든 게시글 배열 (서버에서 받은 초기 데이터로 시작)
  const [posts, setPosts] = useState<PostResponse[]>(initialPosts);

  // 전체 게시글 수 (hasMore 판단에 사용)
  const [, setTotal] = useState(initialTotal);

  // 중복 요청 방지용 로딩 상태
  const [loading, setLoading] = useState(false);

  // 더 불러올 게시글이 있는지 여부
  // 초기값: 로드된 게시글 수가 전체보다 적으면 true
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);

  // IntersectionObserver 인스턴스를 저장하는 ref
  // (리렌더링 시에도 동일한 observer 인스턴스 유지)
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 페이지 하단의 sentinel(감시 대상) DOM 요소를 가리키는 ref
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
```

핵심 개념:

- `posts.length`가 곧 다음 요청의 `offset`이 됩니다 (현재 로드된 개수 = 다음에 건너뛸 개수)
- `hasMore`가 `false`가 되면 IntersectionObserver가 더 이상 `loadMore()`를 호출하지 않습니다

---

## Phase 3: 데이터 Fetch 함수

**서버에서 게시글을 가져오는 핵심 함수입니다. 초기 로드와 추가 로드 모두 이 함수를 사용합니다.**

### 구현 위치

**Client Component**: `components/community/community-section.tsx`

```tsx
const fetchPosts = useCallback(
  async (sort: SortType, reset: boolean) => {
    // 로딩 상태 시작 (중복 호출 방지)
    setLoading(true);

    // reset=true이면 처음부터 (정렬 변경 시), false이면 현재 위치부터 이어서
    const currentOffset = reset ? 0 : posts.length;

    // Server Action 호출: limit=20, offset=현재위치, sort=정렬기준
    const { data } = await getPostList(PAGE_SIZE, currentOffset, sort);

    // 응답에서 게시글 배열과 전체 수 추출
    const newItems = data?.items ?? [];
    const newTotal = data?.total ?? 0;

    if (reset) {
      // 정렬 변경 시: 기존 목록을 새 목록으로 교체
      setPosts(newItems);
    } else {
      // 추가 로드 시: 기존 목록 뒤에 새 항목 추가
      setPosts((prev) => [...prev, ...newItems]);
    }

    // 전체 수 업데이트
    setTotal(newTotal);

    // 더 로드할 수 있는지 판단:
    // reset이면 새로 가져온 수 < 전체
    // 아니면 (현재까지 + 새로 가져온 수) < 전체
    setHasMore(reset ? newItems.length < newTotal : currentOffset + newItems.length < newTotal);

    // 로딩 상태 종료
    setLoading(false);
  },
  // posts.length가 변경될 때마다 새로운 offset을 캡처하기 위해 의존성에 포함
  [posts.length]
);
```

**Server Action**: `lib/api.ts`

```typescript
export const getPostList = async (
  limit?: number, // 가져올 최대 개수
  offset?: number, // 건너뛸 개수 (이미 로드된 수)
  sort?: SortType, // 정렬 기준
  userId?: string // 특정 사용자의 글만 조회 (프로필 페이지용)
) => {
  // openapi-client가 생성한 타입 안전 함수 호출
  // query parameter로 limit, offset, sort, user_id 전달
  const { data, error } = await listPostsApiV1PostsGet({
    query: { limit, offset, sort, user_id: userId },
  });
  return { data, error };
};
```

`useCallback`의 의존성에 `posts.length`를 포함하여, 게시글이 추가될 때마다 다음 fetch가 올바른 offset을 사용하도록 합니다.

---

## Phase 4: IntersectionObserver로 스크롤 감지

**사용자가 페이지 하단까지 스크롤하면 자동으로 다음 페이지를 로드합니다.**

### 구현 위치

**Client Component**: `components/community/community-section.tsx`

```tsx
// 로딩 중이거나 더 이상 데이터가 없으면 호출하지 않도록 래핑
const loadMore = useCallback(() => {
  // loading 중이면 중복 요청 방지
  if (loading || !hasMore) return;

  // 현재 정렬 기준으로, reset=false (이어서 로드)
  fetchPosts(sortType, false);
}, [loading, hasMore, fetchPosts, sortType]);

// IntersectionObserver 설정 및 정리
useEffect(() => {
  // 이전 observer가 있으면 해제 (정리)
  if (observerRef.current) observerRef.current.disconnect();

  // 새 IntersectionObserver 인스턴스 생성
  observerRef.current = new IntersectionObserver(
    (entries) => {
      // entries[0]: 감시 대상 요소 (sentinel div)
      // isIntersecting: 뷰포트에 10% 이상 보이는지 여부
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore();
      }
    },
    // threshold: 0.1 = 요소의 10%가 보이면 트리거
    // (0이면 1px만 보여도 트리거, 1이면 100% 보여야 트리거)
    { threshold: 0.1 }
  );

  // sentinel 요소가 존재하면 관찰 시작
  if (loadMoreRef.current) {
    observerRef.current.observe(loadMoreRef.current);
  }

  // 클린업: 컴포넌트 언마운트 또는 의존성 변경 시 observer 해제
  return () => observerRef.current?.disconnect();
}, [hasMore, loading, loadMore]);
```

**Sentinel 요소** (관찰 대상):

```tsx
{
  /* 이 div가 뷰포트에 들어오면 IntersectionObserver가 loadMore() 호출 */
}
<div ref={loadMoreRef} className="py-6 flex justify-center">
  {/* 로딩 중이면 스피너 표시 */}
  {loading && (
    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  )}
  {/* 모든 데이터를 불러왔으면 완료 메시지 */}
  {!hasMore && posts.length > 0 && (
    <p className="text-xs text-muted-foreground">모든 게시글을 불러왔습니다</p>
  )}
</div>;
```

IntersectionObserver의 장점:

- 스크롤 이벤트 리스너보다 성능이 좋음 (브라우저가 최적화)
- `threshold: 0.1`로 sentinel이 살짝 보이면 바로 로드 시작 (자연스러운 UX)
- 의존성 배열 `[hasMore, loading, loadMore]`로 상태 변경 시 observer를 재생성

---

## Phase 5: 정렬 변경 시 리셋

**사용자가 다른 정렬 탭을 클릭하면, 목록을 처음부터 다시 로드합니다.**

### 구현 위치

**Client Component**: `components/community/community-section.tsx`

```tsx
const handleSortChange = async (newSort: SortType) => {
  // 같은 정렬이면 무시
  if (newSort === sortType) return;

  // 정렬 기준 변경
  setSortType(newSort);

  // hasMore를 true로 리셋 (새 정렬에서 더 가져올 수 있으므로)
  setHasMore(true);

  // reset=true로 호출하여 offset=0부터 새로 가져옴
  await fetchPosts(newSort, true);
};
```

정렬 탭은 두 그룹으로 나뉩니다:

```tsx
// 기본 정렬 (항상 표시)
const primarySortTabs = [
  { key: "popular", label: "인기", icon: TrendingUp }, // 종합 인기도 점수순
  { key: "newest", label: "최신", icon: Clock }, // 최신순
  { key: "most_viewed", label: "조회", icon: BarChart3 }, // 조회수순
  { key: "most_liked", label: "추천", icon: Heart }, // 좋아요순
];

// 시간 윈도우 정렬 (기간별 인기)
const timeWindowTabs = [
  { key: "daily_hot", label: "일간", icon: Flame }, // 최근 24시간 인기
  { key: "weekly_hot", label: "주간", icon: Flame }, // 최근 7일 인기
  { key: "monthly_hot", label: "월간", icon: Calendar }, // 최근 30일 인기
];
```

---

## Phase 6: 백엔드 — Offset 기반 페이지네이션

**백엔드는 `limit`과 `offset` query parameter를 받아 페이지네이션된 결과를 반환합니다.**

### 구현 위치

**Controller**: `server/app/api/v1/post/controller.py`

```python
@router.get(
    "",
    response_model=PostListResponse,  # 응답 스키마: { items, total, limit, offset }
)
async def list_posts(
    postService: Annotated[PostService, Depends(get_post_service)],
    likeService: likeServiceDep,
    current_user: CurrentUserOptional = None,  # 인증 선택적 (비로그인도 조회 가능)
    # limit: 한 번에 가져올 최대 개수 (1~100, 기본 20)
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    # offset: 건너뛸 개수 (기본 0)
    offset: Annotated[int, Query(ge=0)] = 0,
    # user_id: 특정 사용자의 글만 필터링 (선택)
    user_id: Annotated[str | None, Query()] = None,
    # sort: 정렬 기준 (기본: 최신순)
    sort: Annotated[SortType, Query()] = SortType.NEWEST,
) -> PostListResponse:
    # 1. Repository를 통해 게시글 조회 (limit + offset 적용)
    posts = await postService.list_posts(limit=limit, offset=offset, user_id=user_id, sort=sort)

    # 2. 전체 게시글 수 조회 (프론트엔드의 hasMore 판단에 사용)
    total = await postService.post_repo.count(user_id=user_id, sort=sort)

    # 3. 인증된 사용자의 좋아요 상태를 일괄 조회 (N+1 문제 방지)
    like_status = {}
    if current_user:
        post_ids = [post.id for post in posts]
        like_status = await likeService.get_like_status_for_posts(post_ids, current_user.user_id)

    # 4. 응답에 items, total, limit, offset 포함하여 반환
    return PostListResponse(items=items, total=total, limit=limit, offset=offset)
```

**Repository**: `server/app/api/v1/post/repository.py`

```python
async def get_all(
    self,
    limit: int = 20,
    offset: int = 0,
    user_id: str | None = None,
    sort: SortType = SortType.NEWEST,
) -> Sequence[Post]:
    stmt = (
        select(Post)
        .options(
            selectinload(Post.user),   # 작성자를 Eager Load (N+1 방지)
            selectinload(Post.media),  # 미디어를 Eager Load (N+1 방지)
        )
        .where(Post.is_deleted == False)  # 소프트 삭제된 게시글 제외
    )

    # 특정 사용자의 글만 필터링
    if user_id:
        stmt = stmt.where(Post.user_id == user_id)

    # 시간 윈도우 정렬인 경우: WHERE created_at >= (현재 - 기간) 추가
    if sort in TIME_WINDOW_MAP:
        # 예: daily_hot → 24시간 전 이후 게시글만
        cutoff = datetime.now(timezone.utc) - TIME_WINDOW_MAP[sort]
        stmt = stmt.where(Post.created_at >= cutoff)
        # 인기도 점수 내림차순으로 정렬
        stmt = stmt.order_by(desc(Post.popularity_score), desc(Post.created_at))
    else:
        # 단순 정렬: 매핑 테이블에서 ORDER BY 절 가져오기
        # popular → [popularity_score DESC, created_at DESC]
        # newest → [created_at DESC]
        # most_viewed → [view_count DESC, created_at DESC]
        order_clauses = SIMPLE_SORT_MAP.get(sort, [desc(Post.created_at)])
        stmt = stmt.order_by(*order_clauses)

    # LIMIT과 OFFSET 적용 (핵심 페이지네이션 로직)
    stmt = stmt.limit(limit).offset(offset)

    result = await self.session.execute(stmt)
    return result.scalars().all()
```

---

## Phase 7: 인기도 점수 계산 (정렬 알고리즘)

**Reddit에서 영감을 받은 시간 불변(time-invariant) 인기도 점수를 사용합니다.**

### 구현 위치

**Sort Module**: `server/app/api/v1/post/sort.py`

```python
# 앱 기준 시각 (epoch) - 2025년 1월 1일
EPOCH = datetime(2025, 1, 1, tzinfo=timezone.utc)

def compute_popularity_score(
    likes: int,      # 좋아요 수
    comments: int,   # 댓글 수
    views: int,      # 조회 수
    created_at: datetime,  # 게시글 작성 시각
) -> float:
    # 가중 합계: 좋아요 x3, 댓글 x2, 조회 x0.01
    # (좋아요가 가장 강한 신호, 조회는 약한 신호)
    weighted = likes * 3 + comments * 2 + views * 0.01

    # 로그 스케일: 10개 참여 ≈ 100개 ≈ 1000개의 영향력
    # (초기 참여가 큰 점수 변화, 이후 변화는 완만)
    order = math.log10(max(abs(weighted), 1))

    # 음수 참여가 없으므로, sign은 참여가 있으면 1, 없으면 0
    sign = 1 if weighted > 0 else 0

    # 시간 컴포넌트: 작성 시각을 초 단위로 변환
    # /45000 ≈ 매 12.5시간마다 10배 더 많은 참여가 필요
    # (최신 게시글이 자연스럽게 상위에 노출)
    seconds = (created_at - EPOCH).total_seconds()

    return round(sign * order + seconds / 45000, 7)
```

이 점수의 특징:

- **시간 불변**: 점수가 시간이 지나면서 자동으로 감소하지 않음
- **재계산 불필요**: 참여(좋아요, 댓글, 조회) 변경 시에만 업데이트
- **자연스러운 순위**: 최신 게시글은 시간 컴포넌트로 인해 기본적으로 높은 점수를 가짐

---

## 파일 구조

```
client/
├── app/(main)/community/
│   └── page.tsx                          # Server Component: 초기 20개 게시글 SSR 로드
│
├── components/community/
│   └── community-section.tsx             # Client Component: 무한 스크롤 + 정렬 + IntersectionObserver
│
├── lib/
│   ├── api.ts                            # getPostList() Server Action (openapi-client 래핑)
│   └── utils/format.ts                   # formatRelativeTime() 상대 시간 포맷팅
│
└── generated/openapi-client/
    └── types.gen.ts                      # PostResponse, PostListResponse, SortType 타입

server/
├── app/api/v1/post/
│   ├── controller.py                     # list_posts() 엔드포인트: limit/offset/sort/user_id
│   ├── repository.py                     # get_all(): SQL LIMIT/OFFSET + 동적 ORDER BY
│   ├── sort.py                           # SortType enum + compute_popularity_score()
│   └── service.py                        # PostService: Controller ↔ Repository 중간 레이어
│
└── app/models/
    └── post.py                           # Post SQLAlchemy 모델 (popularity_score 컬럼 포함)
```

---

## 핵심 개념 요약

| 개념                     | 설명                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| Offset 기반 페이지네이션 | `limit`과 `offset` query parameter로 페이지 단위 데이터 조회     |
| IntersectionObserver     | 브라우저 API로 sentinel 요소가 뷰포트에 진입하면 콜백 실행       |
| Sentinel 요소            | 목록 하단의 빈 `<div>` — IntersectionObserver가 감시하는 대상    |
| hasMore 플래그           | `로드된_수 < 전체_수`이면 true, 추가 로드 가능 여부 판단         |
| reset 패턴               | 정렬 변경 시 `offset=0`으로 리셋하여 처음부터 다시 로드          |
| SSR 초기 로드            | Server Component에서 첫 페이지를 로드하여 빈 화면 없이 즉시 표시 |
| Eager Loading            | `selectinload()`로 관계 데이터를 한 번에 로드 (N+1 쿼리 방지)    |
| 인기도 점수              | Reddit-inspired 로그 스케일 점수: `log10(참여) + 시간/45000`     |
