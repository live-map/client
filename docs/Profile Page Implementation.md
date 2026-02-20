# Profile Page Implementation - 마이페이지 (게시글/댓글 드롭다운)

이 문서는 프로필 페이지에서 게시글/댓글 통계가 클릭 가능한 드롭다운 목록으로 어떻게 구현되었는지 설명합니다.

사용자가 게시글 또는 댓글 카드를 클릭하면, 자신이 작성한 게시글/댓글 목록이 드롭다운으로 펼쳐집니다. 각 항목에는 삭제 버튼이 있고, "더보기"로 추가 로드가 가능합니다.

### 전체 흐름 다이어그램

```
Browser                  Next.js Server Component         FastAPI Backend            PostgreSQL
  │                            │                              │                        │
  │  1. /profile 접속           │                              │                        │
  │───────────────────────────>│                              │                        │
  │                            │  2. auth() 호출               │                        │
  │                            │  (쿠키에서 JWT 읽어서          │                        │
  │                            │   GET /api/v1/auth/me)        │                        │
  │                            │─────────────────────────────>│                        │
  │                            │  3. 사용자 정보 반환            │                        │
  │                            │<─────────────────────────────│                        │
  │                            │                              │                        │
  │                            │  4. 게시글 + 댓글 동시 조회     │                        │
  │                            │  Promise.all([                │                        │
  │                            │    getPostList(10, 0, _, id), │                        │
  │                            │    getCommentList(_, id, 10)  │                        │
  │                            │  ])                           │                        │
  │                            │─────────────────────────────>│                        │
  │                            │                              │  5. 게시글 10개 +        │
  │                            │                              │  댓글 10개 + 각 total    │
  │                            │                              │─────────────────────────>
  │                            │                              │<─────────────────────────
  │                            │  6. 초기 데이터 반환            │                        │
  │                            │<─────────────────────────────│                        │
  │                            │                              │                        │
  │  7. 프로필 렌더              │                              │                        │
  │  (통계 카드: 게시글 N, 댓글 M)│                              │                        │
  │<───────────────────────────│                              │                        │
  │                            │                              │                        │
  │  === 게시글 카드 클릭 ===     │                              │                        │
  │                            │                              │                        │
  │  8. expandedSection =       │                              │                        │
  │     "posts" 토글            │                              │                        │
  │  9. 이미 로드된 10개 표시     │                              │                        │
  │                            │                              │                        │
  │  === "더보기" 클릭 ===       │                              │                        │
  │                            │                              │                        │
  │  10. loadMorePosts()       │                              │                        │
  │───────────────────────────>│  11. getPostList(10, 10,     │                        │
  │                            │      _, userId)               │                        │
  │                            │─────────────────────────────>│                        │
  │                            │  12. 다음 10개 반환            │                        │
  │                            │<─────────────────────────────│                        │
  │  13. 기존 목록에 추가         │                              │                        │
  │  (총 20개 표시)              │                              │                        │
  │<───────────────────────────│                              │                        │
  │                            │                              │                        │
  │  === 삭제 버튼 클릭 ===      │                              │                        │
  │                            │                              │                        │
  │  14. confirm("삭제?")       │                              │                        │
  │  15. deletePost(id)        │                              │                        │
  │───────────────────────────>│  16. DELETE /api/v1/posts/id  │                        │
  │                            │─────────────────────────────>│                        │
  │                            │  17. 204 No Content           │                        │
  │                            │<─────────────────────────────│                        │
  │  18. 로컬에서 항목 제거       │                              │                        │
  │  + 카운트 -1                │                              │                        │
  │<───────────────────────────│                              │                        │
```

---

## Phase 1: 서버에서 인증 확인 및 초기 데이터 로드

**프로필 페이지에 접속하면, Server Component가 인증을 확인하고 초기 게시글/댓글을 가져옵니다.**

### 구현 위치

**Server Component**: `app/profile/page.tsx`

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPostList, getCommentList } from "@/lib/api";
import ProfileClient from "@/components/profile/profile-client";

export default async function ProfilePage() {
  // 쿠키에서 JWT를 읽어 백엔드 /auth/me로 인증 확인
  const session = await auth();

  // 미인증 사용자는 로그인 페이지로 리다이렉트
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // 세션에서 사용자 정보 추출
  const { id, name, email, image } = session.user;

  // 게시글 10개와 댓글 10개를 동시에 조회 (병렬 처리로 속도 최적화)
  // getPostList(limit=10, offset=0, sort=undefined, userId=id)
  // getCommentList(postId=undefined, userId=id, limit=10)
  const [postsResult, commentsResult] = await Promise.all([
    getPostList(10, 0, undefined, id),
    getCommentList(undefined, id, 10),
  ]);

  // 전체 수 (통계 카드에 표시될 숫자)
  const postCount = postsResult.data?.total ?? 0;
  const commentCount = commentsResult.data?.total ?? 0;

  // 초기 항목 (드롭다운에 표시될 처음 10개)
  const initialPosts = postsResult.data?.items ?? [];
  const initialComments = commentsResult.data?.items ?? [];

  // 클라이언트 컴포넌트에 모든 데이터 전달
  return (
    <ProfileClient
      user={{
        name: name ?? null,
        email: email ?? null,
        image: image ?? null,
        createdAt: new Date().toISOString(),
      }}
      userId={id} // "더보기" 추가 로드에 필요
      postCount={postCount} // 통계 카드 숫자
      commentCount={commentCount} // 통계 카드 숫자
      initialPosts={initialPosts} // 드롭다운 초기 데이터
      initialComments={initialComments} // 드롭다운 초기 데이터
    />
  );
}
```

`Promise.all()`로 게시글과 댓글을 동시에 조회하여 직렬 호출 대비 응답 시간을 절반으로 줄입니다.

---

## Phase 2: 클라이언트 상태 초기화 및 Props 인터페이스

**서버에서 받은 데이터로 클라이언트 컴포넌트의 상태를 초기화합니다.**

### 구현 위치

**Client Component**: `components/profile/profile-client.tsx`

```tsx
// 프로필 사용자 정보 타입
interface ProfileUser {
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;  // ISO 8601 문자열
}

// 컴포넌트에 전달되는 모든 props
interface ProfileClientProps {
  user: ProfileUser;               // 사용자 프로필 정보
  userId: string;                  // "더보기" 시 user_id 필터에 사용
  postCount: number;               // 전체 게시글 수 (통계 카드)
  commentCount: number;            // 전체 댓글 수 (통계 카드)
  initialPosts: PostResponse[];    // 서버에서 미리 로드한 게시글 (최대 10개)
  initialComments: CommentResponse[]; // 서버에서 미리 로드한 댓글 (최대 10개)
}

export default function ProfileClient({
  user, userId, postCount, commentCount, initialPosts, initialComments,
}: ProfileClientProps) {
  // 인증 컨텍스트에서 logout 함수 가져오기
  const { logout } = useAuth();

  // 가입일을 한국어 형식으로 포맷 ("2025년 1월 15일")
  const joinDate = new Date(user.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 현재 펼쳐진 섹션 ("posts" | "comments" | null)
  // null이면 아무 섹션도 펼쳐지지 않음
  const [expandedSection, setExpandedSection] = useState<"posts" | "comments" | null>(null);

  // 현재까지 로드된 게시글/댓글 배열 (서버 데이터로 초기화)
  const [posts, setPosts] = useState<PostResponse[]>(initialPosts);
  const [comments, setComments] = useState<CommentResponse[]>(initialComments);

  // 전체 수 (삭제 시 감소시켜 통계 카드에 즉시 반영)
  const [postsTotal, setPostsTotal] = useState(postCount);
  const [commentsTotal, setCommentsTotal] = useState(commentCount);

  // React 19 useTransition: 비동기 작업 중 UI 블로킹 방지
  // isPending은 "더보기" 로딩 스피너 표시에 사용
  const [isPending, startTransition] = useTransition();
```

`useTransition`을 사용하여 "더보기" 로드 중에도 UI가 반응성을 유지합니다. `isPending` 상태로 로딩 인디케이터를 표시합니다.

---

## Phase 3: "더보기" — 추가 데이터 로드

**사용자가 "더보기" 버튼을 클릭하면, 다음 페이지의 게시글/댓글을 로드합니다.**

### 구현 위치

**Client Component**: `components/profile/profile-client.tsx`

```tsx
const loadMorePosts = () => {
  // startTransition으로 감싸서 로딩 중에도 UI가 반응하도록 함
  startTransition(async () => {
    // offset = 현재 로드된 게시글 수 (posts.length)
    // 예: 이미 10개 로드됨 → offset=10부터 다음 10개 요청
    const result = await getPostList(10, posts.length, undefined, userId);

    if (result.data?.items) {
      // 기존 배열 뒤에 새 항목 추가 (스프레드 연산자로 불변성 유지)
      setPosts((prev) => [...prev, ...result.data!.items]);
    }
  });
};

const loadMoreComments = () => {
  startTransition(async () => {
    // getCommentList(postId=undefined, userId, limit=10, offset=현재_로드_수)
    const result = await getCommentList(undefined, userId, 10, comments.length);

    if (result.data?.items) {
      setComments((prev) => [...prev, ...result.data!.items]);
    }
  });
};
```

**"더보기" 버튼 렌더링**:

```tsx
{/* posts.length < postsTotal일 때만 "더보기" 버튼 표시 */}
{posts.length < postsTotal && (
  <button
    onClick={loadMorePosts}
    disabled={isPending}  {/* 로딩 중이면 비활성화 (중복 클릭 방지) */}
    className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
  >
    {/* isPending이면 로딩 스피너 표시 */}
    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
    더보기
  </button>
)}
```

---

## Phase 4: 클릭 가능한 통계 카드 (토글 드롭다운)

**게시글/댓글 수를 표시하는 카드를 클릭하면, 해당 목록이 펼쳐지거나 접힙니다.**

### 구현 위치

**Client Component**: `components/profile/profile-client.tsx`

```tsx
{
  /* 통계 카드 — 2열 그리드 */
}
<div className="px-4 pb-2">
  <div className="grid grid-cols-2 gap-2">
    {/* 게시글 통계 카드 (클릭 가능한 button 요소) */}
    <button
      onClick={() =>
        // 이미 "posts"가 펼쳐져 있으면 null (접기), 아니면 "posts" (펼치기)
        setExpandedSection(expandedSection === "posts" ? null : "posts")
      }
      className="bg-card border border-border rounded-xl p-3 text-center transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
        {/* ChevronDown: 펼쳐진 상태면 180도 회전 (위를 가리킴) */}
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform ${
            expandedSection === "posts" ? "rotate-180" : ""
          }`}
        />
      </div>
      {/* postsTotal: 삭제 시 즉시 감소하는 로컬 상태값 */}
      <p className="text-lg font-bold text-foreground">{postsTotal}</p>
      <p className="text-[10px] text-muted-foreground">게시글</p>
    </button>

    {/* 댓글 통계 카드 (동일한 토글 패턴) */}
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
      <p className="text-[10px] text-muted-foreground">댓글</p>
    </button>
  </div>
</div>;
```

토글 로직은 단일 `expandedSection` 상태로 관리됩니다:

- `null`: 모두 접힘
- `"posts"`: 게시글 목록만 펼침
- `"comments"`: 댓글 목록만 펼침
- 동일한 카드를 다시 클릭하면 `null`로 돌아감 (접기)

---

## Phase 5: 드롭다운 목록 렌더링

**펼쳐진 섹션에 따라 게시글 또는 댓글 목록을 표시합니다.**

### 구현 위치

**Client Component**: `components/profile/profile-client.tsx`

**게시글 드롭다운**:

```tsx
{
  /* expandedSection이 "posts"일 때만 렌더링 */
}
{
  expandedSection === "posts" && (
    <div className="px-4 pb-4">
      {/* 테두리 있는 카드 컨테이너, 항목 사이에 구분선 */}
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {posts.length === 0 ? (
          // 게시글이 없으면 빈 상태 메시지
          <p className="text-sm text-muted-foreground text-center py-6">작성한 게시글이 없습니다</p>
        ) : (
          // 각 게시글을 카드 형태로 렌더링
          posts.map((post) => (
            <div key={post.id} className="flex items-start gap-3 p-3">
              {/* 클릭하면 게시글 상세 페이지로 이동 */}
              <Link href={`/community/${post.id}`} className="flex-1 min-w-0">
                {/* 게시글 제목 (한 줄, 넘치면 ... 처리) */}
                <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                {/* 메타 정보: 좋아요, 댓글, 조회, 상대 시간 */}
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
                  {/* "3시간 전", "2일 전" 등으로 표시 */}
                  <span>{formatRelativeTime(post.created_at)}</span>
                </div>
              </Link>
              {/* 삭제 버튼 (휴지통 아이콘) */}
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

**댓글 드롭다운**:

```tsx
{
  expandedSection === "comments" && (
    <div className="px-4 pb-4">
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">작성한 댓글이 없습니다</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3 p-3">
              {/* 댓글이 달린 게시글로 이동 (comment.post_id 사용) */}
              <Link href={`/community/${comment.post_id}`} className="flex-1 min-w-0">
                {/* 댓글 내용 (최대 2줄, 넘치면 ... 처리) */}
                <p className="text-sm text-foreground line-clamp-2">{comment.content}</p>
                {/* 작성 시간 */}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(comment.created_at)}
                </p>
              </Link>
              {/* 삭제 버튼 */}
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

## Phase 6: 삭제 기능 (Optimistic UI)

**사용자가 삭제 버튼을 클릭하면, 확인 후 서버에 삭제 요청을 보내고 로컬 상태를 즉시 업데이트합니다.**

### 구현 위치

**Client Component**: `components/profile/profile-client.tsx`

```tsx
const handleDeletePost = async (postId: string) => {
  // 브라우저 기본 확인 다이얼로그
  if (!window.confirm("삭제하시겠습니까?")) return;

  // Server Action 호출: DELETE /api/v1/posts/{postId}
  const { error } = await deletePost(postId);

  if (error) {
    // 서버 오류 시 사용자에게 알림
    alert("삭제에 실패했습니다.");
    return;
  }

  // 성공 시: 로컬 배열에서 해당 게시글 제거 (화면에서 즉시 사라짐)
  setPosts((prev) => prev.filter((p) => p.id !== postId));

  // 통계 카드의 숫자도 즉시 -1 (서버 재요청 없이)
  setPostsTotal((prev) => prev - 1);
};

const handleDeleteComment = async (commentId: string) => {
  if (!window.confirm("삭제하시겠습니까?")) return;

  // Server Action 호출: DELETE /api/v1/comments/{commentId}
  const { error } = await deleteComment(commentId);

  if (error) {
    alert("삭제에 실패했습니다.");
    return;
  }

  // 로컬 배열에서 제거 + 카운트 감소
  setComments((prev) => prev.filter((c) => c.id !== commentId));
  setCommentsTotal((prev) => prev - 1);
};
```

**Server Action**: `lib/api.ts`

```typescript
// 게시글 삭제 (소프트 삭제)
export const deletePost = async (postId: string) => {
  // openapi-client가 생성한 타입 안전 함수 호출
  // DELETE /api/v1/posts/{post_id} → 204 No Content
  const { data, error } = await deletePostApiV1PostsPostIdDelete({
    path: { post_id: postId },
  });
  return { data, error };
};

// 댓글 삭제 (소프트 삭제)
export const deleteComment = async (commentId: string) => {
  // DELETE /api/v1/comments/{comment_id} → 204 No Content
  const { data, error } = await deleteCommentApiV1CommentsCommentIdDelete({
    path: { comment_id: commentId },
  });
  return { data, error };
};
```

삭제의 특징:

- **Confirm 후 실행**: `window.confirm()`으로 실수 방지
- **Optimistic Update**: 서버 응답 성공 후 로컬 상태에서 즉시 제거 (새로고침 불필요)
- **카운트 동기화**: `postsTotal`/`commentsTotal`을 로컬에서 감소시켜 통계 카드에 즉시 반영

---

## Phase 7: 백엔드 — 사용자별 댓글 목록 API

**기존 `GET /api/v1/comments?user_id={id}` 엔드포인트는 댓글 수만 반환했습니다. 프로필 드롭다운을 위해 실제 댓글 항목도 반환하도록 수정했습니다.**

### 구현 위치

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
        # 댓글 작성자 정보를 Eager Load (N+1 쿼리 방지)
        .options(selectinload(Comment.user))
        # 해당 사용자의 삭제되지 않은 댓글만 필터링
        .where(Comment.user_id == user_id, Comment.is_deleted == False)
        # 최신순 정렬 (가장 최근 댓글이 먼저)
        .order_by(Comment.created_at.desc())
        # 페이지네이션 적용
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
    # Repository에 위임 (서비스 레이어는 비즈니스 로직 담당)
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
    # post_id도 user_id도 없으면 400 에러
    if not post_id and not user_id:
        raise HTTPException(status_code=400, detail="post_id 또는 user_id 필수")

    # user_id만 제공된 경우: 사용자의 댓글 목록 + 전체 수 반환
    if user_id and not post_id:
        # 실제 댓글 항목을 가져옴 (기존에는 items=[]로 비어있었음)
        comments = await service.get_user_comments(user_id, limit=limit, offset=offset)
        # 전체 댓글 수 (프론트엔드의 "더보기" 판단에 사용)
        total = await service.get_user_comment_count(user_id)

        # 각 Comment 엔티티를 CommentResponse DTO로 변환
        items = [
            CommentResponse(
                id=comment.id,
                post_id=comment.post_id,      # 어느 게시글에 달린 댓글인지
                user_id=comment.user_id,
                user_name=comment.user.name if comment.user else None,
                parent_id=comment.parent_id,   # 대댓글이면 부모 댓글 ID
                content=comment.content,       # 댓글 내용
                depth=comment.depth,           # 대댓글 깊이 (0=최상위)
                created_at=comment.created_at,
                updated_at=comment.updated_at,
                is_deleted=comment.is_deleted,
                reply_count=0,  # 프로필에서는 대댓글 수 불필요
            )
            for comment in comments
        ]

        return CommentListResponse(items=items, total=total)

    # post_id가 있으면 기존 게시글 댓글 로직 실행 ...
```

**변경 전 vs 변경 후**:

| 항목                        | 변경 전                   | 변경 후                                    |
| --------------------------- | ------------------------- | ------------------------------------------ |
| `GET /comments?user_id=xxx` | `{ items: [], total: 5 }` | `{ items: [댓글1, 댓글2, ...], total: 5 }` |
| 반환되는 필드               | total만                   | id, post_id, content, created_at, ...      |
| 용도                        | 카운트 표시만 가능        | 목록 표시 + 해당 게시글 링크 가능          |

---

## 파일 구조

```
client/
├── app/profile/
│   └── page.tsx                          # Server Component: 인증 확인 + 초기 데이터 로드
│
├── components/profile/
│   └── profile-client.tsx                # Client Component: 클릭 가능한 통계 + 드롭다운 + 삭제
│
├── lib/
│   ├── api.ts                            # deletePost(), deleteComment(), getPostList(),
│   │                                     # getCommentList() Server Actions
│   ├── auth/
│   │   ├── session.ts                    # auth() 서버사이드 인증 함수
│   │   └── auth-context.tsx              # useAuth() 훅 (logout 제공)
│   └── utils/format.ts                   # formatRelativeTime() 상대 시간 포맷팅
│
└── generated/openapi-client/
    └── types.gen.ts                      # PostResponse, CommentResponse 타입

server/
├── app/api/v1/comment/
│   ├── commentController.py              # list_comments_flat: user_id 필터 시 items 반환
│   ├── service.py                        # get_user_comments(): Repository 위임
│   └── repository.py                     # get_by_user(): 사용자 댓글 SQL 쿼리
│
└── app/api/v1/post/
    └── controller.py                     # list_posts: 게시글 목록 (user_id 필터 지원)
```

---

## 핵심 개념 요약

| 개념                       | 설명                                                               |
| -------------------------- | ------------------------------------------------------------------ |
| Server Component 초기 로드 | `auth()` 인증 후 `Promise.all()`로 게시글/댓글을 SSR에서 병렬 조회 |
| 토글 드롭다운              | 단일 `expandedSection` 상태로 "posts" / "comments" / null 전환     |
| ChevronDown 회전           | `rotate-180` CSS transition으로 펼침/접힘 시각적 피드백            |
| useTransition              | React 19의 비동기 전환: "더보기" 로딩 중에도 UI가 반응성 유지      |
| Offset 기반 "더보기"       | `posts.length`를 offset으로 사용하여 다음 페이지 요청              |
| Optimistic Delete          | 서버 삭제 성공 후 `filter()`로 즉시 제거 + 카운트 감소             |
| 백엔드 user_id 필터 확장   | 기존 count-only → items + total 반환으로 변경                      |
