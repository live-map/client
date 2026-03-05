# Profile Page Implementation - My Page (Post/Comment Dropdowns)

This document explains how the post/comment statistics on the profile page are implemented as clickable dropdown lists.

When the user clicks on the post or comment card, a dropdown list expands showing their own posts or comments. Each item has a delete button, and additional items can be loaded via "Load More".

### Overall Flow Diagram

```
Browser                  Next.js Server Component         FastAPI Backend            PostgreSQL
  │                            │                              │                        │
  │  1. Visit /profile         │                              │                        │
  │───────────────────────────>│                              │                        │
  │                            │  2. auth() call               │                        │
  │                            │  (Read JWT from cookie,       │                        │
  │                            │   GET /api/v1/auth/me)        │                        │
  │                            │─────────────────────────────>│                        │
  │                            │  3. Return user info          │                        │
  │                            │<─────────────────────────────│                        │
  │                            │                              │                        │
  │                            │  4. Fetch posts + comments    │                        │
  │                            │  simultaneously               │                        │
  │                            │  Promise.all([                │                        │
  │                            │    getPostList(10, 0, _, id), │                        │
  │                            │    getCommentList(_, id, 10)  │                        │
  │                            │  ])                           │                        │
  │                            │─────────────────────────────>│                        │
  │                            │                              │  5. 10 posts +          │
  │                            │                              │  10 comments + totals   │
  │                            │                              │─────────────────────────>
  │                            │                              │<─────────────────────────
  │                            │  6. Return initial data       │                        │
  │                            │<─────────────────────────────│                        │
  │                            │                              │                        │
  │  7. Render profile         │                              │                        │
  │  (stat cards: Posts N,     │                              │                        │
  │   Comments M)              │                              │                        │
  │<───────────────────────────│                              │                        │
  │                            │                              │                        │
  │  === Click post card ===   │                              │                        │
  │                            │                              │                        │
  │  8. expandedSection =      │                              │                        │
  │     "posts" toggle         │                              │                        │
  │  9. Display already loaded │                              │                        │
  │     10 posts               │                              │                        │
  │                            │                              │                        │
  │  === Click "Load More" === │                              │                        │
  │                            │                              │                        │
  │  10. loadMorePosts()       │                              │                        │
  │───────────────────────────>│  11. getPostList(10, 10,     │                        │
  │                            │      _, userId)               │                        │
  │                            │─────────────────────────────>│                        │
  │                            │  12. Return next 10           │                        │
  │                            │<─────────────────────────────│                        │
  │  13. Append to existing    │                              │                        │
  │  list (20 total displayed) │                              │                        │
  │<───────────────────────────│                              │                        │
  │                            │                              │                        │
  │  === Click delete button ===│                              │                        │
  │                            │                              │                        │
  │  14. confirm("Delete?")    │                              │                        │
  │  15. deletePost(id)        │                              │                        │
  │───────────────────────────>│  16. DELETE /api/v1/posts/id  │                        │
  │                            │─────────────────────────────>│                        │
  │                            │  17. 204 No Content           │                        │
  │                            │<─────────────────────────────│                        │
  │  18. Remove item locally   │                              │                        │
  │  + decrement count by 1    │                              │                        │
  │<───────────────────────────│                              │                        │
```

---

## Phase 1: Server-Side Auth Check and Initial Data Load

**When the profile page is visited, the Server Component verifies authentication and fetches initial posts/comments.**

### Implementation Location

**Server Component**: `app/profile/page.tsx`

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPostList, getCommentList } from "@/lib/api";
import ProfileClient from "@/components/profile/profile-client";

export default async function ProfilePage() {
  // Read JWT from cookie and verify with backend /auth/me
  const session = await auth();

  // Redirect unauthenticated users to the login page
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Extract user info from session
  const { id, name, email, image } = session.user;

  // Fetch 10 posts and 10 comments simultaneously (parallel for speed optimization)
  // getPostList(limit=10, offset=0, sort=undefined, userId=id)
  // getCommentList(postId=undefined, userId=id, limit=10)
  const [postsResult, commentsResult] = await Promise.all([
    getPostList(10, 0, undefined, id),
    getCommentList(undefined, id, 10),
  ]);

  // Total counts (numbers displayed on stat cards)
  const postCount = postsResult.data?.total ?? 0;
  const commentCount = commentsResult.data?.total ?? 0;

  // Initial items (first 10 shown in dropdown)
  const initialPosts = postsResult.data?.items ?? [];
  const initialComments = commentsResult.data?.items ?? [];

  // Pass all data to the client component
  return (
    <ProfileClient
      user={{
        name: name ?? null,
        email: email ?? null,
        image: image ?? null,
        createdAt: new Date().toISOString(),
      }}
      userId={id} // Needed for "Load More" additional fetches
      postCount={postCount} // Stat card number
      commentCount={commentCount} // Stat card number
      initialPosts={initialPosts} // Dropdown initial data
      initialComments={initialComments} // Dropdown initial data
    />
  );
}
```

`Promise.all()` fetches posts and comments simultaneously, cutting response time roughly in half compared to serial calls.

---

## Phase 2: Client State Initialization and Props Interface

**The client component's state is initialized using data received from the server.**

### Implementation Location

**Client Component**: `components/profile/profile-client.tsx`

```tsx
// Profile user info type
interface ProfileUser {
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;  // ISO 8601 string
}

// All props passed to the component
interface ProfileClientProps {
  user: ProfileUser;               // User profile information
  userId: string;                  // Used for user_id filter in "Load More"
  postCount: number;               // Total post count (stat card)
  commentCount: number;            // Total comment count (stat card)
  initialPosts: PostResponse[];    // Posts pre-loaded from server (up to 10)
  initialComments: CommentResponse[]; // Comments pre-loaded from server (up to 10)
}

export default function ProfileClient({
  user, userId, postCount, commentCount, initialPosts, initialComments,
}: ProfileClientProps) {
  // Get the logout function from auth context
  const { logout } = useAuth();

  // Format join date in Korean locale ("January 15, 2025")
  const joinDate = new Date(user.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Currently expanded section ("posts" | "comments" | null)
  // null means no section is expanded
  const [expandedSection, setExpandedSection] = useState<"posts" | "comments" | null>(null);

  // Arrays of loaded posts/comments (initialized with server data)
  const [posts, setPosts] = useState<PostResponse[]>(initialPosts);
  const [comments, setComments] = useState<CommentResponse[]>(initialComments);

  // Total counts (decremented on delete for immediate stat card reflection)
  const [postsTotal, setPostsTotal] = useState(postCount);
  const [commentsTotal, setCommentsTotal] = useState(commentCount);

  // React 19 useTransition: prevents UI blocking during async operations
  // isPending is used to show loading spinner for "Load More"
  const [isPending, startTransition] = useTransition();
```

`useTransition` keeps the UI responsive during "Load More" loading. The `isPending` state displays a loading indicator.

---

## Phase 3: "Load More" — Additional Data Loading

**When the user clicks the "Load More" button, the next page of posts/comments is loaded.**

### Implementation Location

**Client Component**: `components/profile/profile-client.tsx`

```tsx
const loadMorePosts = () => {
  // Wrap in startTransition so the UI remains responsive during loading
  startTransition(async () => {
    // offset = number of currently loaded posts (posts.length)
    // e.g. 10 already loaded -> request next 10 starting from offset=10
    const result = await getPostList(10, posts.length, undefined, userId);

    if (result.data?.items) {
      // Append new items after existing array (spread operator for immutability)
      setPosts((prev) => [...prev, ...result.data!.items]);
    }
  });
};

const loadMoreComments = () => {
  startTransition(async () => {
    // getCommentList(postId=undefined, userId, limit=10, offset=current_loaded_count)
    const result = await getCommentList(undefined, userId, 10, comments.length);

    if (result.data?.items) {
      setComments((prev) => [...prev, ...result.data!.items]);
    }
  });
};
```

**"Load More" button rendering**:

```tsx
{/* Show "Load More" button only when posts.length < postsTotal */}
{posts.length < postsTotal && (
  <button
    onClick={loadMorePosts}
    disabled={isPending}  {/* Disable during loading (prevents duplicate clicks) */}
    className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
  >
    {/* Show loading spinner when isPending */}
    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
    Load More
  </button>
)}
```

---

## Phase 4: Clickable Stat Cards (Toggle Dropdown)

**Clicking the cards that display post/comment counts expands or collapses the corresponding list.**

### Implementation Location

**Client Component**: `components/profile/profile-client.tsx`

```tsx
{
  /* Stat cards — 2-column grid */
}
<div className="px-4 pb-2">
  <div className="grid grid-cols-2 gap-2">
    {/* Post stat card (clickable button element) */}
    <button
      onClick={() =>
        // If "posts" is already expanded, set to null (collapse); otherwise "posts" (expand)
        setExpandedSection(expandedSection === "posts" ? null : "posts")
      }
      className="bg-card border border-border rounded-xl p-3 text-center transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
        {/* ChevronDown: rotates 180 degrees when expanded (points upward) */}
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform ${
            expandedSection === "posts" ? "rotate-180" : ""
          }`}
        />
      </div>
      {/* postsTotal: local state value that decrements immediately on delete */}
      <p className="text-lg font-bold text-foreground">{postsTotal}</p>
      <p className="text-[10px] text-muted-foreground">Posts</p>
    </button>

    {/* Comment stat card (same toggle pattern) */}
    <button
      onClick={() => setExpandedSection(expandedSection === "comments" ? null : "comments")}
      className="bg-card border border-border rounded-xl p-3 text-center transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform ${
            expandedSection === "comments" ? "rotate-180" : ""
          }`}
        />
      </div>
      <p className="text-lg font-bold text-foreground">{commentsTotal}</p>
      <p className="text-[10px] text-muted-foreground">Comments</p>
    </button>
  </div>
</div>;
```

The toggle logic is managed by a single `expandedSection` state:

- `null`: All collapsed
- `"posts"`: Only post list is expanded
- `"comments"`: Only comment list is expanded
- Clicking the same card again returns to `null` (collapse)

---

## Phase 5: Dropdown List Rendering

**Based on the expanded section, either the post or comment list is displayed.**

### Implementation Location

**Client Component**: `components/profile/profile-client.tsx`

**Post dropdown**:

```tsx
{
  /* Only rendered when expandedSection is "posts" */
}
{
  expandedSection === "posts" && (
    <div className="px-4 pb-4">
      {/* Bordered card container with dividers between items */}
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {posts.length === 0 ? (
          // Empty state message when there are no posts
          <p className="text-sm text-muted-foreground text-center py-6">No posts written</p>
        ) : (
          // Render each post as a card
          posts.map((post) => (
            <div key={post.id} className="flex items-start gap-3 p-3">
              {/* Click to navigate to post detail page */}
              <Link href={`/community/${post.id}`} className="flex-1 min-w-0">
                {/* Post title (single line, truncated with ... if overflow) */}
                <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                {/* Meta info: likes, comments, views, relative time */}
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Heart className="w-3 h-3" />
                    {post.like_count ?? 0}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MessageSquare className="w-3 h-3" />
                    {post.comment_count ?? 0}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" />
                    {post.view_count ?? 0}
                  </span>
                  {/* Displayed as "3 hours ago", "2 days ago", etc. */}
                  <span>{formatRelativeTime(post.created_at)}</span>
                </div>
              </Link>
              {/* Delete button (trash icon) */}
              <button
                onClick={() => handleDeletePost(post.id)}
                className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

**Comment dropdown**:

```tsx
{
  expandedSection === "comments" && (
    <div className="px-4 pb-4">
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No comments written</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3 p-3">
              {/* Navigate to the post where the comment was written (uses comment.post_id) */}
              <Link href={`/community/${comment.post_id}`} className="flex-1 min-w-0">
                {/* Comment content (max 2 lines, truncated with ... if overflow) */}
                <p className="text-sm text-foreground line-clamp-2">{comment.content}</p>
                {/* Time written */}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(comment.created_at)}
                </p>
              </Link>
              {/* Delete button */}
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## Phase 6: Delete Functionality (Optimistic UI)

**When the user clicks the delete button, after confirmation, a delete request is sent to the server and the local state is immediately updated.**

### Implementation Location

**Client Component**: `components/profile/profile-client.tsx`

```tsx
const handleDeletePost = async (postId: string) => {
  // Browser native confirmation dialog
  if (!window.confirm("Are you sure you want to delete?")) return;

  // Call Server Action: DELETE /api/v1/posts/{postId}
  const { error } = await deletePost(postId);

  if (error) {
    // Alert the user on server error
    alert("Failed to delete.");
    return;
  }

  // On success: remove the post from local array (disappears from screen immediately)
  setPosts((prev) => prev.filter((p) => p.id !== postId));

  // Also decrement the stat card number immediately by -1 (no server re-request needed)
  setPostsTotal((prev) => prev - 1);
};

const handleDeleteComment = async (commentId: string) => {
  if (!window.confirm("Are you sure you want to delete?")) return;

  // Call Server Action: DELETE /api/v1/comments/{commentId}
  const { error } = await deleteComment(commentId);

  if (error) {
    alert("Failed to delete.");
    return;
  }

  // Remove from local array + decrement count
  setComments((prev) => prev.filter((c) => c.id !== commentId));
  setCommentsTotal((prev) => prev - 1);
};
```

**Server Action**: `lib/api.ts`

```typescript
// Delete post (soft delete)
export const deletePost = async (postId: string) => {
  // Call the type-safe function generated by openapi-client
  // DELETE /api/v1/posts/{post_id} -> 204 No Content
  const { data, error } = await deletePostApiV1PostsPostIdDelete({
    path: { post_id: postId },
  });
  return { data, error };
};

// Delete comment (soft delete)
export const deleteComment = async (commentId: string) => {
  // DELETE /api/v1/comments/{comment_id} -> 204 No Content
  const { data, error } = await deleteCommentApiV1CommentsCommentIdDelete({
    path: { comment_id: commentId },
  });
  return { data, error };
};
```

Characteristics of deletion:

- **Confirm before execution**: `window.confirm()` prevents accidental deletes
- **Optimistic Update**: Immediately removed from local state after successful server response (no refresh needed)
- **Count synchronization**: `postsTotal`/`commentsTotal` decremented locally for immediate stat card reflection

---

## Phase 7: Backend — User-Specific Comment List API

**The existing `GET /api/v1/comments?user_id={id}` endpoint only returned comment count. It was modified to also return actual comment items for the profile dropdown.**

### Implementation Location

**Repository**: `server/app/api/v1/comment/repository.py`

```python
async def get_by_user(
    self,
    user_id: str,
    limit: int = 50,
    offset: int = 0,
) -> Sequence[Comment]:
    stmt = (
        select(Comment)
        # Eager load comment author info (prevents N+1 queries)
        .options(selectinload(Comment.user))
        # Filter to only non-deleted comments by this user
        .where(Comment.user_id == user_id, Comment.is_deleted == False)
        # Sort by newest first (most recent comments appear first)
        .order_by(Comment.created_at.desc())
        # Apply pagination
        .limit(limit)
        .offset(offset)
    )
    result = await self.session.execute(stmt)
    return result.scalars().all()
```

**Service**: `server/app/api/v1/comment/service.py`

```python
async def get_user_comments(
    self,
    user_id: str,
    limit: int = 50,
    offset: int = 0,
) -> Sequence[Comment]:
    # Delegate to repository (service layer handles business logic)
    return await self.comment_repo.get_by_user(user_id, limit, offset)
```

**Controller**: `server/app/api/v1/comment/commentController.py`

```python
@router.get("", response_model=CommentListResponse)
async def list_comments_flat(
    service: CommentServiceDep,
    post_id: Annotated[uuid.UUID | None, Query()] = None,
    user_id: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> CommentListResponse:
    # If neither post_id nor user_id is provided, return 400 error
    if not post_id and not user_id:
        raise HTTPException(status_code=400, detail="post_id or user_id is required")

    # When only user_id is provided: return user's comment list + total count
    if user_id and not post_id:
        # Fetch actual comment items (previously this returned items=[] empty)
        comments = await service.get_user_comments(user_id, limit=limit, offset=offset)
        # Total comment count (used by frontend to determine "Load More")
        total = await service.get_user_comment_count(user_id)

        # Convert each Comment entity to CommentResponse DTO
        items = [
            CommentResponse(
                id=comment.id,
                post_id=comment.post_id,      # Which post this comment belongs to
                user_id=comment.user_id,
                user_name=comment.user.name if comment.user else None,
                parent_id=comment.parent_id,   # Parent comment ID if this is a reply
                content=comment.content,       # Comment content
                depth=comment.depth,           # Reply depth (0=top-level)
                created_at=comment.created_at,
                updated_at=comment.updated_at,
                is_deleted=comment.is_deleted,
                reply_count=0,  # Reply count not needed on profile page
            )
            for comment in comments
        ]

        return CommentListResponse(items=items, total=total)

    # If post_id exists, execute existing post comment logic ...
```

**Before vs After**:

| Aspect                      | Before                    | After                                            |
| --------------------------- | ------------------------- | ------------------------------------------------ |
| `GET /comments?user_id=xxx` | `{ items: [], total: 5 }` | `{ items: [comment1, comment2, ...], total: 5 }` |
| Returned fields             | total only                | id, post_id, content, created_at, ...            |
| Use case                    | Could only display count  | Can display list + link to parent post           |

---

## File Structure

```
client/
├── app/profile/
│   └── page.tsx                          # Server Component: auth check + initial data load
│
├── components/profile/
│   └── profile-client.tsx                # Client Component: clickable stats + dropdown + delete
│
├── lib/
│   ├── api.ts                            # deletePost(), deleteComment(), getPostList(),
│   │                                     # getCommentList() Server Actions
│   ├── auth/
│   │   ├── session.ts                    # auth() server-side auth function
│   │   └── auth-context.tsx              # useAuth() hook (provides logout)
│   └── utils/format.ts                   # formatRelativeTime() relative time formatting
│
└── generated/openapi-client/
    └── types.gen.ts                      # PostResponse, CommentResponse types

server/
├── app/api/v1/comment/
│   ├── commentController.py              # list_comments_flat: returns items for user_id filter
│   ├── service.py                        # get_user_comments(): delegates to Repository
│   └── repository.py                     # get_by_user(): user comment SQL query
│
└── app/api/v1/post/
    └── controller.py                     # list_posts: post list (supports user_id filter)
```

---

## Key Concepts Summary

| Concept                          | Description                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| Server Component initial load    | After `auth()` verification, `Promise.all()` fetches posts/comments in parallel during SSR |
| Toggle dropdown                  | Single `expandedSection` state switches between "posts" / "comments" / null                |
| ChevronDown rotation             | `rotate-180` CSS transition provides visual feedback for expand/collapse                   |
| useTransition                    | React 19 async transition: keeps UI responsive during "Load More" loading                  |
| Offset-based "Load More"         | Uses `posts.length` as offset to request the next page                                     |
| Optimistic delete                | After successful server deletion, `filter()` immediately removes item + decrements count   |
| Backend user_id filter extension | Changed from count-only to returning items + total                                         |
