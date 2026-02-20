# Infinite Pagination Implementation - Community Posts

This document explains how infinite scroll is implemented in the community post list.

As the user scrolls down the post list, new posts are automatically loaded. This implementation combines offset-based pagination with the IntersectionObserver API.

### Overall Flow Diagram

```
Browser (React)              Next.js Server Action           FastAPI Backend            PostgreSQL
  │                               │                              │                        │
  │  1. Page visit                │                              │                        │
  │  (Server Component render)    │                              │                        │
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
  │                               │                              │  4. Return results      │
  │                               │                              │<─────────────────────────
  │                               │  5. { items: [...20 posts],  │                        │
  │                               │     total: 150 }             │                        │
  │                               │<─────────────────────────────│                        │
  │  6. Render initial 20 posts   │                              │                        │
  │  + Set up IntersectionObserver│                              │                        │
  │<──────────────────────────────│                              │                        │
  │                               │                              │                        │
  │  === User scrolls to bottom ===│                              │                        │
  │                               │                              │                        │
  │  7. IntersectionObserver      │                              │                        │
  │  triggers (sentinel detected) │                              │                        │
  │                               │                              │                        │
  │  8. loadMore() called         │                              │                        │
  │──────────────────────────────>│  9. getPostList(20, 20,      │                        │
  │                               │     "popular")               │                        │
  │                               │  GET /api/v1/posts?          │                        │
  │                               │  limit=20&offset=20          │                        │
  │                               │─────────────────────────────>│                        │
  │                               │                              │  10. LIMIT 20 OFFSET 20│
  │                               │                              │─────────────────────────>
  │                               │                              │  11. Return results     │
  │                               │                              │<─────────────────────────
  │                               │  12. { items: [...20 posts], │                        │
  │                               │      total: 150 }            │                        │
  │                               │<─────────────────────────────│                        │
  │  13. Append 20 to existing    │                              │                        │
  │  list (40 total displayed)    │                              │                        │
  │<──────────────────────────────│                              │                        │
  │                               │                              │                        │
  │  === If offset >= total ===   │                              │                        │
  │  hasMore = false → stop scroll│                              │                        │
```

---

## Phase 1: Server-Side Initial Data Load

**When the page is first visited, the Server Component pre-fetches the first 20 posts.**

### Implementation Location

**Server Component**: `app/(main)/community/page.tsx`

```tsx
// Tell Next.js to always render this page dynamically (no caching)
export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  // Call the backend API directly from the Server Component (first 20, offset 0, sorted by popularity)
  const { data } = await getPostList(20, 0, "popular");

  // Pass initial data as props to the client component
  // data can be null, so use ?? operator for empty array/0 defaults
  return <CommunitySection initialPosts={data?.items ?? []} initialTotal={data?.total ?? 0} />;
}
```

By setting `force-dynamic`, the latest posts are fetched on every request. Since data is fetched in a Server Component, the first page is already prepared before reaching the client (SSR benefit).

---

## Phase 2: Client State Initialization

**The client component's initial state is set using data received from the server.**

### Implementation Location

**Client Component**: `components/community/community-section.tsx`

```tsx
// Number of posts to fetch at a time (page size)
const PAGE_SIZE = 20;

export function CommunitySection({ initialPosts, initialTotal }: CommunitySectionProps) {
  // Currently selected sort type (popular, newest, views, likes, daily/weekly/monthly hot)
  const [sortType, setSortType] = useState<SortType>("popular");

  // Array of all posts loaded so far (starts with initial data from server)
  const [posts, setPosts] = useState<PostResponse[]>(initialPosts);

  // Total post count (used to determine hasMore)
  const [, setTotal] = useState(initialTotal);

  // Loading state to prevent duplicate requests
  const [loading, setLoading] = useState(false);

  // Whether there are more posts to load
  // Initial value: true if loaded post count is less than total
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);

  // Ref to store the IntersectionObserver instance
  // (maintains the same observer instance across re-renders)
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Ref pointing to the sentinel (observed target) DOM element at the bottom of the page
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
```

Key concepts:

- `posts.length` serves as the `offset` for the next request (number loaded = number to skip)
- When `hasMore` becomes `false`, IntersectionObserver stops calling `loadMore()`

---

## Phase 3: Data Fetch Function

**This is the core function that fetches posts from the server. Both initial loads and subsequent loads use this function.**

### Implementation Location

**Client Component**: `components/community/community-section.tsx`

```tsx
const fetchPosts = useCallback(
  async (sort: SortType, reset: boolean) => {
    // Start loading state (prevents duplicate calls)
    setLoading(true);

    // If reset=true, start from the beginning (on sort change); otherwise continue from current position
    const currentOffset = reset ? 0 : posts.length;

    // Call Server Action: limit=20, offset=current position, sort=sort criteria
    const { data } = await getPostList(PAGE_SIZE, currentOffset, sort);

    // Extract the post array and total count from the response
    const newItems = data?.items ?? [];
    const newTotal = data?.total ?? 0;

    if (reset) {
      // On sort change: replace existing list with new list
      setPosts(newItems);
    } else {
      // On load more: append new items after existing list
      setPosts((prev) => [...prev, ...newItems]);
    }

    // Update total count
    setTotal(newTotal);

    // Determine if more can be loaded:
    // If reset: new count < total
    // Otherwise: (current + new count) < total
    setHasMore(reset ? newItems.length < newTotal : currentOffset + newItems.length < newTotal);

    // End loading state
    setLoading(false);
  },
  // Include posts.length in dependencies to capture the correct offset when posts are added
  [posts.length]
);
```

**Server Action**: `lib/api.ts`

```typescript
export const getPostList = async (
  limit?: number, // Maximum number to fetch
  offset?: number, // Number to skip (already loaded count)
  sort?: SortType, // Sort criteria
  userId?: string // Filter by specific user's posts (for profile page)
) => {
  // Call the type-safe function generated by openapi-client
  // Passes limit, offset, sort, user_id as query parameters
  const { data, error } = await listPostsApiV1PostsGet({
    query: { limit, offset, sort, user_id: userId },
  });
  return { data, error };
};
```

By including `posts.length` in `useCallback`'s dependencies, each subsequent fetch uses the correct offset as posts are added.

---

## Phase 4: Scroll Detection with IntersectionObserver

**When the user scrolls to the bottom of the page, the next page is automatically loaded.**

### Implementation Location

**Client Component**: `components/community/community-section.tsx`

```tsx
// Wrap to prevent calling when loading or no more data exists
const loadMore = useCallback(() => {
  // Prevent duplicate requests while loading
  if (loading || !hasMore) return;

  // Fetch with current sort criteria, reset=false (continue loading)
  fetchPosts(sortType, false);
}, [loading, hasMore, fetchPosts, sortType]);

// Set up and clean up IntersectionObserver
useEffect(() => {
  // Disconnect previous observer if it exists (cleanup)
  if (observerRef.current) observerRef.current.disconnect();

  // Create a new IntersectionObserver instance
  observerRef.current = new IntersectionObserver(
    (entries) => {
      // entries[0]: the observed target element (sentinel div)
      // isIntersecting: whether 10% or more is visible in the viewport
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore();
      }
    },
    // threshold: 0.1 = trigger when 10% of the element is visible
    // (0 would trigger when even 1px is visible, 1 would require 100%)
    { threshold: 0.1 }
  );

  // Start observing if the sentinel element exists
  if (loadMoreRef.current) {
    observerRef.current.observe(loadMoreRef.current);
  }

  // Cleanup: disconnect observer on component unmount or dependency change
  return () => observerRef.current?.disconnect();
}, [hasMore, loading, loadMore]);
```

**Sentinel Element** (observation target):

```tsx
{
  /* When this div enters the viewport, IntersectionObserver calls loadMore() */
}
<div ref={loadMoreRef} className="py-6 flex justify-center">
  {/* Show spinner while loading */}
  {loading && (
    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  )}
  {/* Show completion message when all data has been loaded */}
  {!hasMore && posts.length > 0 && (
    <p className="text-xs text-muted-foreground">All posts have been loaded</p>
  )}
</div>;
```

Advantages of IntersectionObserver:

- Better performance than scroll event listeners (optimized by the browser)
- `threshold: 0.1` starts loading as soon as the sentinel is slightly visible (smooth UX)
- Dependency array `[hasMore, loading, loadMore]` recreates the observer when state changes

---

## Phase 5: Sort Change Reset

**When the user clicks a different sort tab, the list is reloaded from the beginning.**

### Implementation Location

**Client Component**: `components/community/community-section.tsx`

```tsx
const handleSortChange = async (newSort: SortType) => {
  // Ignore if same sort is selected
  if (newSort === sortType) return;

  // Update sort criteria
  setSortType(newSort);

  // Reset hasMore to true (the new sort may have more items)
  setHasMore(true);

  // Call with reset=true to fetch from offset=0
  await fetchPosts(newSort, true);
};
```

Sort tabs are divided into two groups:

```tsx
// Primary sorts (always visible)
const primarySortTabs = [
  { key: "popular", label: "Popular", icon: TrendingUp }, // Overall popularity score
  { key: "newest", label: "Newest", icon: Clock }, // Most recent
  { key: "most_viewed", label: "Views", icon: BarChart3 }, // By view count
  { key: "most_liked", label: "Likes", icon: Heart }, // By like count
];

// Time-windowed sorts (period-based popularity)
const timeWindowTabs = [
  { key: "daily_hot", label: "Daily", icon: Flame }, // Popular in last 24 hours
  { key: "weekly_hot", label: "Weekly", icon: Flame }, // Popular in last 7 days
  { key: "monthly_hot", label: "Monthly", icon: Calendar }, // Popular in last 30 days
];
```

---

## Phase 6: Backend — Offset-Based Pagination

**The backend accepts `limit` and `offset` query parameters to return paginated results.**

### Implementation Location

**Controller**: `server/app/api/v1/post/controller.py`

```python
@router.get(
    "",
    response_model=PostListResponse,  # Response schema: { items, total, limit, offset }
)
async def list_posts(
    postService: Annotated[PostService, Depends(get_post_service)],
    likeService: likeServiceDep,
    current_user: CurrentUserOptional = None,  # Auth optional (non-logged-in users can view)
    # limit: Maximum number to fetch per request (1-100, default 20)
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    # offset: Number to skip (default 0)
    offset: Annotated[int, Query(ge=0)] = 0,
    # user_id: Filter to a specific user's posts only (optional)
    user_id: Annotated[str | None, Query()] = None,
    # sort: Sort criteria (default: newest)
    sort: Annotated[SortType, Query()] = SortType.NEWEST,
) -> PostListResponse:
    # 1. Query posts through Repository (with limit + offset applied)
    posts = await postService.list_posts(limit=limit, offset=offset, user_id=user_id, sort=sort)

    # 2. Query total post count (used by frontend to determine hasMore)
    total = await postService.post_repo.count(user_id=user_id, sort=sort)

    # 3. Batch query like status for authenticated users (prevents N+1 problem)
    like_status = {}
    if current_user:
        post_ids = [post.id for post in posts]
        like_status = await likeService.get_like_status_for_posts(post_ids, current_user.user_id)

    # 4. Return response with items, total, limit, offset
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
            selectinload(Post.user),   # Eager load author (prevents N+1)
            selectinload(Post.media),  # Eager load media (prevents N+1)
        )
        .where(Post.is_deleted == False)  # Exclude soft-deleted posts
    )

    # Filter to a specific user's posts only
    if user_id:
        stmt = stmt.where(Post.user_id == user_id)

    # For time-windowed sorts: add WHERE created_at >= (now - period)
    if sort in TIME_WINDOW_MAP:
        # e.g. daily_hot -> only posts from the last 24 hours
        cutoff = datetime.now(timezone.utc) - TIME_WINDOW_MAP[sort]
        stmt = stmt.where(Post.created_at >= cutoff)
        # Sort by popularity score descending
        stmt = stmt.order_by(desc(Post.popularity_score), desc(Post.created_at))
    else:
        # Simple sorts: get ORDER BY clauses from the mapping table
        # popular -> [popularity_score DESC, created_at DESC]
        # newest -> [created_at DESC]
        # most_viewed -> [view_count DESC, created_at DESC]
        order_clauses = SIMPLE_SORT_MAP.get(sort, [desc(Post.created_at)])
        stmt = stmt.order_by(*order_clauses)

    # Apply LIMIT and OFFSET (core pagination logic)
    stmt = stmt.limit(limit).offset(offset)

    result = await self.session.execute(stmt)
    return result.scalars().all()
```

---

## Phase 7: Popularity Score Calculation (Sorting Algorithm)

**Uses a Reddit-inspired time-invariant popularity score.**

### Implementation Location

**Sort Module**: `server/app/api/v1/post/sort.py`

```python
# Application epoch - January 1, 2025
EPOCH = datetime(2025, 1, 1, tzinfo=timezone.utc)

def compute_popularity_score(
    likes: int,      # Like count
    comments: int,   # Comment count
    views: int,      # View count
    created_at: datetime,  # Post creation time
) -> float:
    # Weighted sum: likes x3, comments x2, views x0.01
    # (likes are the strongest signal, views are a weak signal)
    weighted = likes * 3 + comments * 2 + views * 0.01

    # Logarithmic scale: 10 engagements ~ 100 ~ 1000 in impact
    # (early engagement causes large score changes, later changes are gradual)
    order = math.log10(max(abs(weighted), 1))

    # Since negative engagement doesn't exist, sign is 1 if engagement exists, 0 otherwise
    sign = 1 if weighted > 0 else 0

    # Time component: convert creation time to seconds
    # /45000 ~ every 12.5 hours, a post needs 10x more engagement
    # (newer posts naturally rank higher)
    seconds = (created_at - EPOCH).total_seconds()

    return round(sign * order + seconds / 45000, 7)
```

Properties of this score:

- **Time-invariant**: Score does not automatically decay over time
- **No periodic recomputation needed**: Only updates when engagement (likes, comments, views) changes
- **Natural ranking**: Newer posts inherently have a higher score due to the time component

---

## File Structure

```
client/
├── app/(main)/community/
│   └── page.tsx                          # Server Component: SSR load of initial 20 posts
│
├── components/community/
│   └── community-section.tsx             # Client Component: infinite scroll + sorting + IntersectionObserver
│
├── lib/
│   ├── api.ts                            # getPostList() Server Action (openapi-client wrapper)
│   └── utils/format.ts                   # formatRelativeTime() relative time formatting
│
└── generated/openapi-client/
    └── types.gen.ts                      # PostResponse, PostListResponse, SortType types

server/
├── app/api/v1/post/
│   ├── controller.py                     # list_posts() endpoint: limit/offset/sort/user_id
│   ├── repository.py                     # get_all(): SQL LIMIT/OFFSET + dynamic ORDER BY
│   ├── sort.py                           # SortType enum + compute_popularity_score()
│   └── service.py                        # PostService: Controller <-> Repository middle layer
│
└── app/models/
    └── post.py                           # Post SQLAlchemy model (includes popularity_score column)
```

---

## Key Concepts Summary

| Concept                 | Description                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| Offset-based pagination | Fetches data in pages using `limit` and `offset` query parameters                              |
| IntersectionObserver    | Browser API that executes a callback when a sentinel element enters the viewport               |
| Sentinel element        | An empty `<div>` at the bottom of the list — the target that IntersectionObserver watches      |
| hasMore flag            | `true` if `loaded_count < total_count`, determines whether more loading is possible            |
| Reset pattern           | On sort change, resets to `offset=0` to reload from the beginning                              |
| SSR initial load        | Server Component loads the first page so content is displayed immediately with no blank screen |
| Eager loading           | `selectinload()` loads related data in one query (prevents N+1 query problem)                  |
| Popularity score        | Reddit-inspired log-scale score: `log10(engagement) + time/45000`                              |
