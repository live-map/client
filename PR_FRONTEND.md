# [Frontend] QA Phase 1: 배포 전 전수 검사 수정

> `feature/grapoll` | 9 commits | 28 files (+467 / -1,966)

## 요약

배포 전 전수 리뷰에서 발견한 보안 취약점, dead code, 데이터 매핑 오류, 미연결 기능을 수정합니다. **총 1,912줄의 불필요한 코드를 삭제**하고 누락된 백엔드 API 연결을 완성합니다.

---

## 1. Prisma ORM 완전 제거 (-988줄)

백엔드 API로 완전 전환되었으나 Prisma 의존성이 남아있었음. Raw `pg` + 커스텀 어댑터로 교체.

### 삭제

```
prisma/schema.prisma    — 257줄 스키마 정의
prisma.config.ts        — 14줄 설정
lib/prisma.ts           — 25줄 클라이언트 싱글턴
```

### 신규: Raw SQL NextAuth 어댑터 (`lib/auth/adapter.ts`, 154줄)

```typescript
export function PgAdapter(pool: Pool): Adapter {
  return {
    async createUser(user) {
      const { rows } = await pool.query(
        `INSERT INTO users (id, name, email, email_verified, image, role)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [id, user.name, user.email, user.emailVerified, user.image, "USER"]
      );
      return mapUser(rows[0]);
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const { rows } = await pool.query(
        `SELECT u.* FROM users u
         JOIN accounts a ON u.id = a.user_id
         WHERE a.provider = $1 AND a.provider_account_id = $2`,
        [provider, providerAccountId]
      );
      return rows.length ? mapUser(rows[0]) : null;
    },
    // ... createSession/getSession은 JWT 전략이므로 stub
  };
}
```

### 변경: auth config (`lib/auth/config.ts`)

```typescript
// Before
import { PrismaAdapter } from "@auth/prisma-adapter";
adapter: PrismaAdapter(prisma),

// After
import { PgAdapter } from "@/lib/auth/adapter";
adapter: PgAdapter(pool),
```

### 패키지 변경 (`package.json`)

- 삭제: `prisma`, `@prisma/client`, `@auth/prisma-adapter`, `bcryptjs`
- 추가: `@paralleldrive/cuid2` (어댑터에서 ID 생성용)

---

## 2. Dead Code 삭제 (-924줄)

| 파일                                        | 줄 수  | 이유                             |
| ------------------------------------------- | ------ | -------------------------------- |
| `components/polls/poll/vote-card.tsx`       | -841줄 | `FloatingVoteBar`로 완전 대체됨  |
| `components/polls/home/suggest-section.tsx` | -79줄  | `UserPollSection`으로 대체됨     |
| `lib/api.ts: getPollComments()`             | -4줄   | poll detail 응답에 comments 포함 |

---

## 3. XSS 방어 (`poll-detail-client.tsx`)

마크다운 렌더러의 `parseInline()`이 HTML을 이스케이프하지 않아 XSS 가능했음.

```typescript
// 추가: HTML 이스케이프
const escapeHtml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Before — raw HTML 주입 가능
return text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

// After — 이스케이프 + https만 허용
const escaped = escapeHtml(text);
return escaped.replace(/\[(.*?)\]\((https?:\/\/[^\)]*)\)/g, '<a href="$2">$1</a>');
```

`javascript:alert(1)` 같은 scheme 주입을 `https?://` 패턴으로 차단.

---

## 4. 댓글 좋아요/삭제 연결

백엔드 API는 있었지만 프론트에서 호출하지 않던 문제.

### API 함수 추가 (`lib/api.ts`)

```typescript
export const likePollComment = async (pollId: string, commentId: string) =>
  apiFetch(`/api/v1/polls/${pollId}/comments/${commentId}/like`, { method: "POST" });

export const deletePollComment = async (pollId: string, commentId: string) =>
  apiFetch(`/api/v1/polls/${pollId}/comments/${commentId}`, { method: "DELETE" });
```

### 서버 액션 추가 (`mutations.ts`)

```typescript
export async function likePollComment(pollId: string, commentId: string)
  : Promise<ActionResult<{ likes: number }>> { ... }

export async function deletePollComment(pollId: string, commentId: string)
  : Promise<ActionResult> { ... }
```

### UI 연결 (`poll-detail-client.tsx`)

```typescript
const handleLikeComment = (commentId: string) => {
  if (!isLoggedIn) {
    openLoginModal("좋아요를 누르려면 로그인이 필요합니다");
    return;
  }
  startTransition(async () => {
    const result = await likePollComment(poll.id, commentId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  });
};

const handleDeleteComment = (commentId: string) => {
  setConfirmDialog({
    title: "댓글 삭제",
    description: "댓글을 삭제하시겠습니까?",
    onConfirm: () => {
      /* deletePollComment → toast → router.refresh */
    },
  });
};
```

---

## 5. 확인 다이얼로그 도입 (`poll-detail-client.tsx`)

`window.confirm()` → shadcn `Dialog` 컴포넌트로 교체. 여론조사 삭제, 댓글 삭제 모두 적용.

```typescript
const [confirmDialog, setConfirmDialog] = useState<{
  title: string;
  description: string;
  onConfirm: () => void;
} | null>(null);

// 사용
const handleDelete = () => {
  setConfirmDialog({
    title: "여론조사 삭제",
    description: "정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    onConfirm: () => {
      /* deletePoll → redirect */
    },
  });
};
```

---

## 6. 데이터 매핑 수정

### 슬라이더 결과 표시 (`poll-detail-client.tsx`)

```typescript
// Before — 하드코딩
<p className="text-3xl font-bold">7.2</p>

// After — 백엔드 averageSliderValue 사용
<p className="text-3xl font-bold text-primary">
  {sliderAvg != null ? sliderAvg.toFixed(1) : "-"}
</p>
```

슬라이더 타입일 때 옵션별 바 차트 대신 평균 점수 + 그래디언트 바를 표시하도록 분기.

### HotDebate 가짜 데이터 제거 (`hot-debate.tsx`)

하드코딩된 투표수/퍼센트 → 실제 `totalVotes`, 옵션별 `voteCount` 기반 계산.

### UserPollSection 매핑 (`polls-home-client.tsx`)

```typescript
// Before
likes: p.viewCount,  // 조회수를 좋아요로 표시
comments: 0,         // 항상 0

// After
likes: p.totalVotes, // 실제 투표수
// comments 필드 및 아이콘 제거 (API 미제공)
```

### EMOJI_REACTION 매핑 누락 (`poll-detail-client.tsx`)

```typescript
const INTERACTION_TYPE_TO_POLL_TYPE: Record<string, PollType> = {
  BINARY: "binary",
  SINGLE_CHOICE: "multiple",
  MULTIPLE_CHOICE: "checkbox",
  SLIDER: "scale",
  RANKING: "ranking",
  EMOJI_REACTION: "multiple", // 누락되어 있었음
};
```

---

## 7. 인증 미들웨어 보호 (`middleware.ts`)

여론조사 수정 페이지(`/polls/:id/edit`)가 보호 라우트에 빠져있었음.

```typescript
// Before — 정적 경로만
const protectedPaths = ["/polls/suggest/new", "/profile"];
const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

// After — 동적 패턴 추가
const isProtected =
  protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
  /^\/polls\/[^/]+\/edit$/.test(pathname);

// matcher도 추가
matcher: ["/polls/suggest/new", "/polls/:pollId/edit", "/profile/:path*"],
```

---

## 8. API 타입 강화 (`lib/api.ts`, `mutations.ts`)

모든 API body를 `Record<string, unknown>` → 구체적 인터페이스로 교체.

```typescript
// Before
export const castVote = async (pollId: string, body: Record<string, unknown>) => ...
export async function castVote(dto: ...): Promise<ActionResult<Record<string, unknown>>>

// After
export const castVote = async (pollId: string, body: {
  interactionType: string;
  optionId?: string;
  sliderValue?: number;
  selectedOptionIds?: string[];
  rankingData?: string[];
}) => ...
export async function castVote(dto: ...): Promise<ActionResult>
```

`createPoll`, `updatePoll`, `createPollComment`, `castVote` 4개 함수 모두 적용.
미사용 `data` 변수도 제거 (`const { data, error }` → `const { error }`).

---

## 변경 파일

```
[신규]
lib/auth/adapter.ts                       — Raw SQL NextAuth 어댑터 (154줄)
lib/pg.ts                                 — pg Pool 싱글턴
lib/types/poll.ts                         — PollOption 타입

[삭제]
prisma/schema.prisma                      — -257줄
prisma.config.ts                          — -14줄
lib/prisma.ts                             — -25줄
components/polls/poll/vote-card.tsx        — -841줄
components/polls/home/suggest-section.tsx  — -79줄

[수정]
components/polls/poll/poll-detail-client.tsx — XSS 방어, 슬라이더 결과, 댓글 연결, 확인 다이얼로그
app/actions/polls/mutations.ts              — 댓글 좋아요/삭제, ActionResult 타입 정리
lib/api.ts                                  — body 타입, 댓글 API, dead code 제거
lib/auth/config.ts                          — PrismaAdapter → PgAdapter
app/profile/page.tsx                        — Prisma → raw SQL
middleware.ts                               — /polls/:id/edit 보호 추가
components/polls/home/polls-home-client.tsx  — 라우트 경로, UserPollSection 매핑
components/polls/home/user-poll-section.tsx  — comments prop/아이콘 제거
components/polls/home/hot-debate.tsx         — 하드코딩 → 실제 데이터
components/polls/home/poll-list.tsx          — 정렬 UI 수정
components/polls/poll/interactions/*.tsx (6) — import 경로 수정
package.json, pnpm-lock.yaml               — Prisma 제거, cuid2 추가
```
