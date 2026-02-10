# Post Sorting Implementation

This document explains how post sorting is implemented in this project, covering the sorting algorithm, database design, and how it integrates across the backend and frontend.

## Table of Contents

1. [Overview](#overview)
2. [Sort Types](#sort-types)
3. [Popularity Scoring Algorithm](#popularity-scoring-algorithm)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Integration](#frontend-integration)
6. [Database Design](#database-design)
7. [Project File Structure](#project-file-structure)
8. [Complete Flow Diagrams](#complete-flow-diagrams)

---

## Overview

Posts can be sorted by 7 criteria using a single API endpoint with a `sort` query parameter. The implementation follows these design principles:

- **1 database query per page load** regardless of sort type
- **Reddit-style time-invariant popularity scoring** — no cron jobs needed
- **Precomputed denormalized columns** — `view_count`, `comment_count`, `popularity_score` stored on the Post model
- **Dynamic ORDER BY** via Enum-to-column mapping, not separate repository methods

---

## Sort Types

All 7 sort types are defined as a single `SortType` enum:

| Enum Value    | Label       | Strategy                                                       |
| ------------- | ----------- | -------------------------------------------------------------- |
| `popular`     | 인기순      | `ORDER BY popularity_score DESC`                               |
| `newest`      | 최신순      | `ORDER BY created_at DESC`                                     |
| `most_viewed` | 조회순      | `ORDER BY view_count DESC`                                     |
| `most_liked`  | 추천순      | `ORDER BY like_count DESC`                                     |
| `daily_hot`   | 일간 인기순 | `WHERE created_at >= now()-1d ORDER BY popularity_score DESC`  |
| `weekly_hot`  | 주간 인기순 | `WHERE created_at >= now()-7d ORDER BY popularity_score DESC`  |
| `monthly_hot` | 월간 인기순 | `WHERE created_at >= now()-30d ORDER BY popularity_score DESC` |

**Key insight**: Time-windowed sorts (daily/weekly/monthly) are NOT separate algorithms. They reuse the same `popularity_score` column with an added `WHERE created_at >= cutoff` filter.

**Location**: `server/app/api/v1/post/sort.py`

```python
class SortType(str, Enum):
    POPULAR = "popular"
    NEWEST = "newest"
    MOST_VIEWED = "most_viewed"
    MOST_LIKED = "most_liked"
    DAILY_HOT = "daily_hot"
    WEEKLY_HOT = "weekly_hot"
    MONTHLY_HOT = "monthly_hot"
```

---

## Popularity Scoring Algorithm

### The `compute_popularity_score()` Function

We use a Reddit-inspired hot score formula that is **time-invariant** — the score only changes when engagement changes, not as time passes.

**Location**: `server/app/api/v1/post/sort.py`

```python
def compute_popularity_score(likes, comments, views, created_at) -> float:
    weighted = likes * 3 + comments * 2 + views * 0.01
    order = log10(max(abs(weighted), 1))
    sign = 1 if weighted > 0 else 0
    seconds = (created_at - EPOCH).total_seconds()
    return sign * order + seconds / 45000
```

### Formula Explained

```
score = sign × log₁₀(weighted_engagement) + creation_seconds / 45000
```

1. **Weighted engagement**: `likes × 3 + comments × 2 + views × 0.01`
   - Likes are weighted highest (direct approval)
   - Comments next (active engagement)
   - Views lowest (passive engagement)

2. **Logarithmic scaling**: `log₁₀(engagement)`
   - First 10 engagements = next 100 = next 1000 in score impact
   - Prevents a single viral post from permanently dominating

3. **Time component**: `creation_seconds / 45000`
   - Increases linearly with creation time
   - `/45000` ≈ every 12.5 hours, a post needs 10x more engagement to maintain rank
   - Newer posts naturally rank higher even with fewer engagements

### Why Time-Invariant?

Unlike Hacker News's formula (which decays over time), our score uses **absolute creation time**:

```
HN:     score = votes / (age_hours + 2)^1.8       ← changes every minute
Reddit: score = log(votes) + creation_time/45000   ← only changes on vote
```

This means:

- **No cron jobs** needed for score recalculation
- Score is recomputed **only** when `like_count`, `comment_count`, or `view_count` changes
- Fewer database writes = better performance

### When Score is Recalculated

| Event              | Trigger Location                                  |
| ------------------ | ------------------------------------------------- |
| Post created       | `PostService.create_post_without_commit()`        |
| Post liked/unliked | `PostLikeService.like_post()` / `unlike_post()`   |
| Comment created    | `CommentService.create_comment()`                 |
| Comment deleted    | `CommentService.delete_comment()`                 |
| Post viewed        | `get_post()` controller (increments `view_count`) |

Note: `view_count` increment on detail view does NOT trigger a popularity recalculation (the 0.01 weight makes per-view recalculation unnecessary). Popularity is only recalculated on likes and comments.

---

## Backend Implementation

### Architecture Flow

```
Client Request
  GET /api/v1/posts?sort=daily_hot&limit=20&offset=0
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Controller (controller.py)             │
│  - Receives SortType enum from query    │
│  - Passes to service                    │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Service (service.py)                   │
│  - Passes sort to repository            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Repository (repository.py)             │
│  - Checks SIMPLE_SORT_MAP or            │
│    TIME_WINDOW_MAP                      │
│  - Builds single SQL query with         │
│    dynamic ORDER BY (+ WHERE for        │
│    time-windowed sorts)                 │
│  - Returns results                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  PostgreSQL                             │
│  - Uses partial composite index         │
│  - Single index scan → results          │
└─────────────────────────────────────────┘
```

### Sort Mapping (sort.py)

The sort module defines two dictionaries that the repository uses:

```python
# Simple sorts → ORDER BY columns
SIMPLE_SORT_MAP = {
    SortType.POPULAR:     [desc(Post.popularity_score), desc(Post.created_at)],
    SortType.NEWEST:      [desc(Post.created_at)],
    SortType.MOST_VIEWED: [desc(Post.view_count), desc(Post.created_at)],
    SortType.MOST_LIKED:  [desc(Post.like_count), desc(Post.created_at)],
}

# Time-windowed sorts → timedelta cutoff
TIME_WINDOW_MAP = {
    SortType.DAILY_HOT:   timedelta(days=1),
    SortType.WEEKLY_HOT:  timedelta(days=7),
    SortType.MONTHLY_HOT: timedelta(days=30),
}
```

### Repository Query Logic

```python
async def get_all(self, limit, offset, user_id, sort):
    stmt = select(Post).where(Post.is_deleted == False)

    if sort in TIME_WINDOW_MAP:
        # Time-windowed: filter + sort by popularity
        cutoff = datetime.now(UTC) - TIME_WINDOW_MAP[sort]
        stmt = stmt.where(Post.created_at >= cutoff)
        stmt = stmt.order_by(desc(Post.popularity_score), desc(Post.created_at))
    else:
        # Simple: just sort by mapped columns
        stmt = stmt.order_by(*SIMPLE_SORT_MAP[sort])

    return await session.execute(stmt.limit(limit).offset(offset))
```

### Controller Endpoint

```python
@router.get("", response_model=PostListResponse)
async def list_posts(
    sort: Annotated[SortType, Query(description="정렬 기준")] = SortType.NEWEST,
    limit: int = 20,
    offset: int = 0,
    ...
):
```

The `SortType` enum as a query parameter automatically:

- Validates input (invalid values return 422)
- Prevents SQL injection (column names are never interpolated)
- Generates OpenAPI documentation with all valid values

---

## Frontend Integration

### API Usage

The generated OpenAPI client includes the `sort` parameter:

```typescript
import { getPostList } from "@/lib/api";

// In a Server Component
const { data } = await getPostList({
  query: { sort: "daily_hot", limit: 20, offset: 0 },
});
```

### TypeScript Types (Auto-generated)

```typescript
// From generated/openapi-client/types.gen.ts
export type SortType =
  | "popular"
  | "newest"
  | "most_viewed"
  | "most_liked"
  | "daily_hot"
  | "weekly_hot"
  | "monthly_hot";
```

### Sort Options for UI

```typescript
const SORT_OPTIONS = [
  { value: "popular", label: "인기순" },
  { value: "newest", label: "최신순" },
  { value: "most_viewed", label: "조회순" },
  { value: "most_liked", label: "추천순" },
  { value: "daily_hot", label: "일간 인기" },
  { value: "weekly_hot", label: "주간 인기" },
  { value: "monthly_hot", label: "월간 인기" },
] as const;
```

---

## Database Design

### Denormalized Columns on `posts` Table

| Column             | Type             | Default | Updated When                         |
| ------------------ | ---------------- | ------- | ------------------------------------ |
| `like_count`       | INTEGER          | 0       | Like/unlike                          |
| `view_count`       | INTEGER          | 0       | Post detail viewed                   |
| `comment_count`    | INTEGER          | 0       | Comment created/deleted              |
| `popularity_score` | DOUBLE PRECISION | 0.0     | Like/unlike, comment created/deleted |

### Partial Composite Indexes

All indexes include `WHERE is_deleted = false` to only index active posts:

```sql
-- 인기순 (popularity)
CREATE INDEX idx_posts_popularity
  ON posts (popularity_score DESC, created_at DESC)
  WHERE is_deleted = false;

-- 조회순 (view count)
CREATE INDEX idx_posts_views
  ON posts (view_count DESC, created_at DESC)
  WHERE is_deleted = false;

-- 추천순 (like count)
CREATE INDEX idx_posts_likes
  ON posts (like_count DESC, created_at DESC)
  WHERE is_deleted = false;

-- 시간 윈도우 + 인기순 (daily/weekly/monthly hot)
CREATE INDEX idx_posts_time_pop
  ON posts (created_at, popularity_score DESC)
  WHERE is_deleted = false;
```

### Why Partial Indexes?

- Smaller index size — only active posts are indexed
- Faster scans — fewer entries to traverse
- PostgreSQL uses these automatically when the query includes `WHERE is_deleted = false`

### Why Composite with `created_at`?

Secondary sort by `created_at DESC` ensures deterministic ordering when primary scores are tied (e.g., two posts with the same `like_count` are ordered by newest first).

---

## Project File Structure

```
server/
├── app/
│   ├── api/v1/post/
│   │   ├── sort.py              # SortType enum, scoring function, sort maps
│   │   ├── controller.py        # GET /posts?sort= endpoint
│   │   ├── service.py           # list_posts(sort=), recalculate_popularity()
│   │   ├── repository.py        # get_all(sort=), count(sort=) with dynamic ORDER BY
│   │   ├── dto/
│   │   │   └── schemas.py       # PostResponse (includes view_count)
│   │   └── like/
│   │       └── service.py       # Recalculates score on like/unlike
│   ├── api/v1/comment/
│   │   └── service.py           # Updates comment_count + score on create/delete
│   └── models/
│       └── post.py              # Post model (view_count, comment_count, popularity_score)

client/
├── generated/
│   └── openapi-client/
│       └── types.gen.ts         # SortType type, sort query param
├── lib/
│   └── api.ts                   # getPostList (passes sort param)
└── docs/
    └── Post Sorting Implementation.md  # This file
```

---

## Complete Flow Diagrams

### Sort Query Flow

```
[1] User selects "주간 인기순" in UI
        │
        ▼
[2] Frontend sends request
    GET /api/v1/posts?sort=weekly_hot&limit=20&offset=0
        │
        ▼
[3] FastAPI validates SortType enum
    sort = SortType.WEEKLY_HOT  ✓
    (invalid value → 422 Validation Error)
        │
        ▼
[4] Controller passes sort to Service
    postService.list_posts(sort=SortType.WEEKLY_HOT)
        │
        ▼
[5] Service passes sort to Repository
    post_repo.get_all(sort=SortType.WEEKLY_HOT)
        │
        ▼
[6] Repository checks TIME_WINDOW_MAP
    SortType.WEEKLY_HOT → timedelta(days=7)
        │
        ▼
[7] Repository builds query:
    SELECT * FROM posts
    WHERE is_deleted = false
      AND created_at >= now() - interval '7 days'
    ORDER BY popularity_score DESC, created_at DESC
    LIMIT 20 OFFSET 0
        │
        ▼
[8] PostgreSQL uses idx_posts_time_pop index
    → Single index scan → returns sorted results
        │
        ▼
[9] Response sent to frontend with sorted posts
```

### Popularity Score Update Flow (Like)

```
[1] User clicks "좋아요" button
        │
        ▼
[2] POST /api/v1/posts/{id}/like
        │
        ▼
[3] PostLikeService.like_post()
    ├── Create PostLike record
    ├── Increment Post.like_count (atomic UPDATE SET like_count = like_count + 1)
    ├── Recalculate popularity_score:
    │     score = log₁₀(likes×3 + comments×2 + views×0.01)
    │            + creation_seconds / 45000
    └── COMMIT
        │
        ▼
[4] Post now has updated like_count and popularity_score
    → Affects all sort orders that use these columns
```

### Popularity Score Update Flow (Comment)

```
[1] User submits a comment
        │
        ▼
[2] POST /api/v1/comments
        │
        ▼
[3] CommentService.create_comment()
    ├── Create Comment record
    ├── Increment Post.comment_count
    ├── Recalculate Post.popularity_score
    └── COMMIT
        │
        ▼
[4] Post now ranks higher in popularity-based sorts
```

---

## Key Concepts Summary

| Concept                | Description                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| Dynamic ORDER BY       | Single repo method with Enum-to-column mapping instead of 7 separate methods  |
| Time-invariant scoring | Reddit-style formula where score only changes on engagement, not time passage |
| Denormalized counters  | `like_count`, `view_count`, `comment_count` stored on Post for O(1) sort      |
| Precomputed score      | `popularity_score` column updated on engagement change, indexed for fast sort |
| Partial indexes        | `WHERE is_deleted = false` — smaller index, only active posts                 |
| Composite indexes      | Secondary sort by `created_at DESC` for deterministic tie-breaking            |
| Time-windowed sorts    | Same popularity score + `WHERE created_at >= cutoff` filter                   |

## Scaling Path

| Phase             | Scale        | Strategy                                                                           |
| ----------------- | ------------ | ---------------------------------------------------------------------------------- |
| Phase 1 (current) | < 500K posts | Direct PostgreSQL queries with partial composite indexes                           |
| Phase 2           | 500K+ posts  | Add materialized views for time-windowed sorts, refresh via `pg_cron` every 15 min |
| Phase 3           | Millions     | Add Redis sorted sets as read cache for top 3 most popular sorts                   |
