# 여론조사 기능 비활성화 (Commented Out)

## What Was Commented Out

### 1. `polls-home-client.tsx` (수정, 파일 유지)

**유지된 것:**

- 여론조사/커뮤니티 탭 전환 UI (`PollsHeader` + `activeTab` state)
- 커뮤니티 탭 (`CommunitySection` + `V0_COMMUNITY_POSTS`)

**비활성화된 것:**

- `HomeHero`, `HotDebate`, `PollList`, `UserPollSection` 임포트
- `V0_POLL_LIST`, `V0_HOT_DEBATES_BY_TYPE`, `V0_USER_POLLS` 목 데이터 임포트
- `useRouter`, `handlePollClick`, `handleCreatePoll` 핸들러
- 여론조사 탭의 모든 컴포넌트 렌더링 -> "여론조사 기능 준비중입니다." 플레이스홀더로 대체

---

### 2. Home Components (5개 파일, 컴포넌트 본문 비활성화)

| File                    | Component         | Description                                                               |
| ----------------------- | ----------------- | ------------------------------------------------------------------------- |
| `home-hero.tsx`         | `HomeHero`        | 히어로 배너 ("투명한 대한민국을 클릭 한번으로 만들어보세요")              |
| `hot-debate.tsx`        | `HotDebate`       | 실시간 뜨거운 토론 카드 (퍼센트 애니메이션, 댓글 로테이션, 라이브 카운트) |
| `poll-list.tsx`         | `PollList`        | 여론조사 리스트 (검색, 정렬, 카테고리 필터, 폴 카드)                      |
| `user-poll-section.tsx` | `UserPollSection` | 유저 제안 여론조사 섹션 (정렬, 필터, 제안 목록)                           |
| `suggest-section.tsx`   | `SuggestSection`  | 홈 화면 여론조사 제안 섹션 (제안 목록, 만들기 버튼)                       |

각 파일은 유지되며 컴포넌트는 `return null`로 대체. 원본 코드는 주석으로 보존.

---

### 3. Poll Detail & Vote Components (2개 파일, 컴포넌트 본문 비활성화)

| File                          | Component          | Description                                                                       |
| ----------------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `poll/poll-detail-client.tsx` | `PollDetailClient` | 여론조사 상세 페이지 (마크다운 렌더러, 샘플 데이터, 투표 UI, 댓글, 플로팅 투표바) |
| `poll/vote-card.tsx`          | `VoteCard`         | 투표 모달 카드 (6가지 인터랙션 타입, 결과 뷰, 출처 표시)                          |

`VoteCard` 내부의 헬퍼 컴포넌트도 함께 비활성화:

- `InteractionView` - 인터랙션 타입별 투표 UI 분기
- `ResultView` - 인터랙션 타입별 결과 UI 분기
- `SingleChoiceResult`, `BinaryResult`, `EmojiResult`, `SliderResult`, `MultipleChoiceResult`, `RankingResult`

---

### 4. Interaction Components (7개 파일, 6개 컴포넌트 + 배럴 익스포트)

| File                                           | Component                   | Description                                                  |
| ---------------------------------------------- | --------------------------- | ------------------------------------------------------------ |
| `interactions/index.ts`                        | (배럴 익스포트)             | 6개 인터랙션 컴포넌트 re-export (유지, stub 컴포넌트로 연결) |
| `interactions/single-choice-interaction.tsx`   | `SingleChoiceInteraction`   | 단일 선택 (라디오 버튼 형태, 후보자 색상 매핑)               |
| `interactions/binary-interaction.tsx`          | `BinaryInteraction`         | 양자택일 (A/B 선택 카드, 파란색/빨간색)                      |
| `interactions/emoji-interaction.tsx`           | `EmojiInteraction`          | 이모지 반응 (이모지 + 라벨 파싱)                             |
| `interactions/slider-interaction.tsx`          | `SliderInteraction`         | 슬라이더 (Radix Slider, 0-100 스펙트럼)                      |
| `interactions/multiple-choice-interaction.tsx` | `MultipleChoiceInteraction` | 복수 선택 (체크박스, 색상 인덱싱)                            |
| `interactions/ranking-interaction.tsx`         | `RankingInteraction`        | 순위 매기기 (dnd-kit 드래그 앤 드롭, SortableItem 포함)      |

---

### 5. Poll Types Components (`types/poll-types.tsx`, 1개 파일)

| Component         | Description                                         |
| ----------------- | --------------------------------------------------- |
| `MultiplePoll`    | 다지선다 투표 (3개 이상 옵션 중 1개)                |
| `CheckboxPoll`    | 복수선택 투표                                       |
| `ScalePoll`       | 척도/슬라이더 투표 (range input, 결과 분포)         |
| `RankingPoll`     | 순위 투표 (HTML5 드래그)                            |
| `YesNoPoll`       | 찬반 투표                                           |
| `PredictionPoll`  | 예측 투표 (배당률 표시)                             |
| `FloatingVoteBar` | 플로팅 투표 바 (하단 빠른 투표, 모든 pollType 분기) |

타입 정의(`PollType`, `PollOption`)는 플레이스홀더로 재정의하여 임포트 에러 방지.

---

### 6. Suggest Components (2개 파일, 컴포넌트 본문 비활성화)

| File                        | Component      | Description                                   |
| --------------------------- | -------------- | --------------------------------------------- |
| `suggest/poll-form.tsx`     | `PollForm`     | 여론조사 제안 폼 (RHF + Zod, createPoll 호출) |
| `suggest/option-fields.tsx` | `OptionFields` | 선택지 동적 입력 필드 (useFieldArray, 2-10개) |

---

### 7. Server Actions - Queries (`app/actions/polls/queries.ts`)

**비활성화된 함수:**

| Function              | Used By                       | Description                                     |
| --------------------- | ----------------------------- | ----------------------------------------------- |
| `getHomeFeed()`       | (미사용, mock 데이터 사용 중) | 홈 피드 데이터 (highlight, trending, suggested) |
| `getTrendingPolls()`  | (미사용)                      | 인기순 여론조사 목록                            |
| `getSuggestedPolls()` | (미사용)                      | 유저 제안 여론조사 목록                         |
| `getHotDebate()`      | (미사용)                      | 가장 접전인 BINARY 토론                         |
| `getPollById()`       | `poll-detail-client.tsx`      | 여론조사 상세 (댓글 포함)                       |
| `getUserVote()`       | `vote-card.tsx`               | 사용자 투표 여부 확인                           |
| `getUserVotedPolls()` | (프로필 페이지)               | 사용자가 투표한 여론조사 목록                   |
| `getUserPolls()`      | (프로필 페이지)               | 사용자가 제안한 여론조사 목록                   |
| `getPollFeed()`       | (미사용, mock 사용 중)        | 홈 피드 여론조사 (정렬+검색+페이징)             |

**유지된 것:** 타입 정의 (`PollCardData`, `PollSortMode`, `HotDebateData` 등)는 플레이스홀더로 재정의하여 다른 파일에서 임포트 시 타입 에러 방지.

---

### 8. Server Actions - Mutations (`app/actions/polls/mutations.ts`)

**비활성화된 함수:**

| Function               | Used By                  | Description                     |
| ---------------------- | ------------------------ | ------------------------------- |
| `castVote()`           | `vote-card.tsx`          | 투표 처리 (6가지 인터랙션 타입) |
| `createPoll()`         | `poll-form.tsx`          | 여론조사 제안 생성              |
| `updatePoll()`         | (관리 페이지)            | 여론조사 수정                   |
| `deletePoll()`         | (관리 페이지)            | 여론조사 삭제                   |
| `incrementViewCount()` | `poll-detail-client.tsx` | 조회수 증가                     |

---

## Commented Out Files Summary

총 **19개 파일** 수정:

| #   | Path                                                                 | Type     | Status                                               |
| --- | -------------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| 1   | `components/polls/home/polls-home-client.tsx`                        | 수정     | 여론조사 탭 내용만 비활성화, 탭 전환 유지            |
| 2   | `components/polls/home/home-hero.tsx`                                | 비활성화 | `return null`                                        |
| 3   | `components/polls/home/hot-debate.tsx`                               | 비활성화 | `return null`                                        |
| 4   | `components/polls/home/poll-list.tsx`                                | 비활성화 | `return null`                                        |
| 5   | `components/polls/home/user-poll-section.tsx`                        | 비활성화 | `return null`                                        |
| 6   | `components/polls/home/suggest-section.tsx`                          | 비활성화 | `return null`                                        |
| 7   | `components/polls/poll/poll-detail-client.tsx`                       | 비활성화 | `return null`                                        |
| 8   | `components/polls/poll/vote-card.tsx`                                | 비활성화 | `return null`                                        |
| 9   | `components/polls/poll/interactions/index.ts`                        | 수정     | 코멘트 추가, re-export 유지 (stub으로 연결)          |
| 10  | `components/polls/poll/interactions/single-choice-interaction.tsx`   | 비활성화 | `return null`                                        |
| 11  | `components/polls/poll/interactions/binary-interaction.tsx`          | 비활성화 | `return null`                                        |
| 12  | `components/polls/poll/interactions/emoji-interaction.tsx`           | 비활성화 | `return null`                                        |
| 13  | `components/polls/poll/interactions/slider-interaction.tsx`          | 비활성화 | `return null`                                        |
| 14  | `components/polls/poll/interactions/multiple-choice-interaction.tsx` | 비활성화 | `return null`                                        |
| 15  | `components/polls/poll/interactions/ranking-interaction.tsx`         | 비활성화 | `return null`                                        |
| 16  | `components/polls/types/poll-types.tsx`                              | 비활성화 | `return null` (7개 컴포넌트), 타입 플레이스홀더 유지 |
| 17  | `components/polls/suggest/poll-form.tsx`                             | 비활성화 | `return null`                                        |
| 18  | `components/polls/suggest/option-fields.tsx`                         | 비활성화 | `return null`                                        |
| 19  | `app/actions/polls/queries.ts` + `mutations.ts`                      | 비활성화 | 모든 서버 액션 함수, 타입 플레이스홀더 유지          |

---

## Impact on the Project

### Immediate Effects

- 여론조사 탭 클릭 시 "여론조사 기능 준비중입니다." 메시지 표시
- 커뮤니티 탭은 정상 동작
- 탭 전환 UI (여론조사/커뮤니티) 정상 동작

### Pages Accessible But Non-Functional

아래 라우트들은 컴포넌트가 `return null`로 대체되어 빈 화면이 표시됨:

- `/polls/[pollId]` - 여론조사 상세 페이지 (`PollDetailClient` → `return null`)
- `/polls/suggest/create` - 여론조사 제안 생성 (`PollForm` → `return null`)
- `/polls/all` - 전체 여론조사 목록
- `/polls/suggest` - 제안 목록
- `/polls/profile/*` - 프로필 관련 페이지

### No Impact On

- 인증 시스템 (NextAuth) - 영향 없음
- 커뮤니티 탭 - 정상 동작
- 다른 페이지 (items 등) - 영향 없음
- `lib/constants/cache-tags.ts` - poll 관련 태그는 남아있으나 호출되지 않음
- `lib/constants/messages.ts` - poll 관련 에러 메시지는 남아있으나 호출되지 않음
- `lib/constants/candidates.ts` - 후보자 맵은 남아있으나 사용되지 않음
- `lib/validations/poll.ts` - 스키마 파일은 그대로 유지
- `lib/mock/polls.ts` - mock 데이터 파일은 그대로 유지 (커뮤니티 mock 데이터도 포함)

---

## Component Dependency Map

```
polls-home-client.tsx (수정됨)
├── PollsHeader          ✅ 유지 (탭 전환 UI)
├── CommunitySection     ✅ 유지 (커뮤니티 탭)
│   └── V0_COMMUNITY_POSTS (lib/mock/polls.ts)
│
├── HomeHero             ❌ 비활성화
├── HotDebate            ❌ 비활성화
│   └── V0_HOT_DEBATES_BY_TYPE (lib/mock/polls.ts)
├── PollList             ❌ 비활성화
│   └── V0_POLL_LIST (lib/mock/polls.ts)
├── UserPollSection      ❌ 비활성화
│   └── V0_USER_POLLS (lib/mock/polls.ts)
└── SuggestSection       ❌ 비활성화

PollDetailClient         ❌ 비활성화 (별도 페이지 /polls/[pollId])
├── PollType types       ❌ 비활성화 (poll-types.tsx)
├── ScalePoll            ❌ 비활성화 (poll-types.tsx)
├── FloatingVoteBar      ❌ 비활성화 (poll-types.tsx)
└── pollSamples 데이터   ❌ 비활성화 (인라인 목 데이터)

VoteCard                 ❌ 비활성화 (모달 카드)
├── SingleChoiceInteraction  ❌ 비활성화
├── BinaryInteraction        ❌ 비활성화
├── EmojiInteraction         ❌ 비활성화
├── SliderInteraction        ❌ 비활성화
├── MultipleChoiceInteraction ❌ 비활성화
├── RankingInteraction       ❌ 비활성화
├── castVote()               ❌ 비활성화 (mutations.ts)
└── Result Components        ❌ 비활성화 (6개)

PollForm                 ❌ 비활성화 (별도 페이지 /polls/suggest/create)
├── OptionFields         ❌ 비활성화
└── createPoll()         ❌ 비활성화 (mutations.ts)
```

### Server Actions Called By Components

```
HomeHero
└── (no server actions - static content)

HotDebate
└── getHotDebate() [queries.ts] ❌

PollList
├── getPollFeed() [queries.ts] ❌
└── getTrendingPolls() [queries.ts] ❌

UserPollSection
└── getSuggestedPolls() [queries.ts] ❌

PollDetailClient ❌ (컴포넌트 자체가 비활성화)
├── getPollById() [queries.ts] ❌
├── getUserVote() [queries.ts] ❌
├── incrementViewCount() [mutations.ts] ❌
└── VoteCard ❌
    └── castVote() [mutations.ts] ❌

PollForm ❌ (컴포넌트 자체가 비활성화)
└── createPoll() [mutations.ts] ❌
```

---

## Files NOT Modified (유지)

| File                                          | Reason                                            |
| --------------------------------------------- | ------------------------------------------------- |
| `components/polls/layout/polls-header.tsx`    | 탭 전환 UI - 여론조사/커뮤니티 전환에 필요        |
| `components/polls/home/community-section.tsx` | 커뮤니티 탭 - 정상 동작 필요                      |
| `lib/mock/polls.ts`                           | V0_COMMUNITY_POSTS가 커뮤니티 탭에서 사용 중      |
| `lib/validations/poll.ts`                     | Zod 스키마 - 타입 참조에 필요                     |
| `lib/constants/cache-tags.ts`                 | 캐시 태그 상수 - 호출되지 않으나 삭제 불필요      |
| `lib/constants/messages.ts`                   | 에러 메시지 상수 - 호출되지 않으나 삭제 불필요    |
| `lib/constants/candidates.ts`                 | 후보자 맵 - 호출되지 않으나 삭제 불필요           |
| `app/actions/polls/index.ts`                  | 배럴 익스포트 - queries/mutations 재익스포트 유지 |

---

## How to Restore

모든 변경은 주석 처리로만 이루어졌으므로, 주석을 해제하면 원래 상태로 복원 가능합니다.

1. `polls-home-client.tsx` - 주석 해제하고 플레이스홀더 제거
2. `home-hero.tsx`, `hot-debate.tsx`, `poll-list.tsx`, `user-poll-section.tsx`, `suggest-section.tsx` - 주석 해제하고 stub 함수 제거
3. `poll-detail-client.tsx`, `vote-card.tsx` - 주석 해제하고 stub 함수 제거
4. `interactions/*.tsx` (6개) - 주석 해제하고 stub 함수 제거
5. `types/poll-types.tsx` - 주석 해제하고 플레이스홀더 타입/stub 제거
6. `suggest/poll-form.tsx`, `suggest/option-fields.tsx` - 주석 해제하고 stub 함수 제거
7. `app/actions/polls/queries.ts` - 주석 해제하고 플레이스홀더 타입 제거
8. `app/actions/polls/mutations.ts` - 주석 해제

각 파일에 `[COMMENTED OUT]` 마커가 있어 검색으로 쉽게 찾을 수 있습니다.
