# Grapoll 여론조사 Structure

## Overview

여론조사 (Grapoll) is a polling/survey system supporting 6 interaction types: single choice, binary, emoji reaction, slider, multiple choice, and ranking. It includes poll creation (user suggestions), voting, hot debates, and community discussion.

---

## App Routes

```
app/polls/
├── page.tsx                          # Main polls home
├── layout.tsx                        # Layout (metadata: "Grapoll - 여론조사")
├── [pollId]/page.tsx                 # Poll detail (dynamic)
├── all/page.tsx                      # All polls list
├── about/page.tsx                    # About page
├── login/page.tsx                    # Login page
├── privacy/page.tsx                  # Privacy policy
├── terms/page.tsx                    # Terms of service
├── suggest/
│   ├── page.tsx                      # Suggestions list
│   ├── create/page.tsx               # Create suggestion form
│   ├── new/page.tsx                  # New suggestions
│   └── [id]/page.tsx                 # View individual suggestion
└── profile/
    ├── page.tsx                      # User profile
    ├── edit/page.tsx                 # Edit profile
    └── settings/
        ├── page.tsx                  # Settings
        ├── email/page.tsx            # Email settings
        ├── password/page.tsx         # Password settings
        └── social/page.tsx           # Social settings
```

---

## Components

### Home (`components/polls/home/`)

| File                    | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `polls-home-client.tsx` | Main home with tab switching (여론조사 / 커뮤니티)                    |
| `home-hero.tsx`         | Hero section / intro banner                                           |
| `hot-debate.tsx`        | Featured hot debate section with comments                             |
| `poll-list.tsx`         | Poll list with search, sort (popular/recent/ending), category filters |
| `user-poll-section.tsx` | User-suggested polls carousel                                         |
| `suggest-section.tsx`   | CTA to suggest new polls                                              |
| `community-section.tsx` | Community discussion posts                                            |

### Layout (`components/polls/layout/`)

| File               | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `polls-header.tsx` | Sticky auto-hide header with tab indicators and profile button |

### Poll Detail (`components/polls/poll/`)

| File                     | Description                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| `poll-detail-client.tsx` | Full poll detail view (options, voting, comments, sources, AI content) |
| `vote-card.tsx`          | Core voting interface - dispatches to interaction components by type   |

### Interactions (`components/polls/poll/interactions/`)

| Component                         | Type              | Description                                 |
| --------------------------------- | ----------------- | ------------------------------------------- |
| `single-choice-interaction.tsx`   | `SINGLE_CHOICE`   | Radio buttons with color-coded options      |
| `binary-interaction.tsx`          | `BINARY`          | Two-button A/B choice                       |
| `emoji-interaction.tsx`           | `EMOJI_REACTION`  | Emoji reaction buttons                      |
| `slider-interaction.tsx`          | `SLIDER`          | Spectrum slider (0-100) with color gradient |
| `multiple-choice-interaction.tsx` | `MULTIPLE_CHOICE` | Checkboxes for multi-select                 |
| `ranking-interaction.tsx`         | `RANKING`         | Drag-and-drop ranking                       |
| `index.ts`                        | -                 | Barrel export for all interactions          |

### Poll Types (`components/polls/types/`)

| Export            | Description                         |
| ----------------- | ----------------------------------- |
| `MultiplePoll`    | Single choice from multiple options |
| `CheckboxPoll`    | Multiple selection with submit      |
| `ScalePoll`       | Slider 1-10                         |
| `RankingPoll`     | Drag-and-drop ranking               |
| `YesNoPoll`       | Binary yes/no                       |
| `PredictionPoll`  | Prediction with odds                |
| `FloatingVoteBar` | Compact bottom bar voting interface |

### Suggest (`components/polls/suggest/`)

| File                | Description                               |
| ------------------- | ----------------------------------------- |
| `poll-form.tsx`     | RHF + Zod form for creating polls         |
| `option-fields.tsx` | Dynamic option field array (2-10 options) |

---

## Server Actions (`app/actions/polls/`)

### `index.ts`

Re-exports all queries and mutations.

### `queries.ts`

| Function                   | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `getHomeFeed()`            | Returns highlight, trending, and suggested polls |
| `getTrendingPolls(limit)`  | Top polls by vote count                          |
| `getSuggestedPolls(limit)` | User suggestions sorted by view count            |
| `getHotDebate()`           | Most competitive binary poll                     |

### `mutations.ts`

| Function                       | Description                                                    |
| ------------------------------ | -------------------------------------------------------------- |
| `castVote(ctx, dto)`           | Vote on a poll (supports all 6 interaction types)              |
| `createPoll(ctx, dto)`         | Create a user-suggested poll (type: SUGGESTED, status: ACTIVE) |
| `updatePoll(ctx, pollId, dto)` | Update poll title, description, status                         |

---

## Validations (`lib/validations/poll.ts`)

| Schema             | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `pollOptionSchema` | Option text (1-200 chars)                             |
| `pollSourceSchema` | Source citation (URL, type, description)              |
| `createPollSchema` | Poll creation (title, 2-10 options, optional sources) |
| `updatePollSchema` | Partial update schema                                 |
| `castVoteSchema`   | Discriminated union for 6 vote types                  |

**Exported Types:** `CreatePollFormValues`, `UpdatePollFormValues`, `CastVoteDto`

---

## Constants

### Cache Tags (`lib/constants/cache-tags.ts`)

```
POLLS, POLL(id), USER_POLLS(userId), USER_VOTES(userId),
TRENDING_POLLS, SUGGESTED_POLLS, POLL_FEED, HOT_DEBATE
```

### Error Messages (`lib/constants/messages.ts`)

```
POLL_NOT_FOUND, POLL_OWNER_ONLY, POLL_NOT_ACTIVE, POLL_ALREADY_VOTED,
POLL_OPTION_NOT_FOUND, POLL_OPTION_INVALID, POLL_MIN_OPTIONS,
POLL_MAX_OPTIONS, POLL_CREATED
```

---

## Mock Data (`lib/mock/polls.ts`)

| Export                                     | Description                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| `V0_POLL_LIST`                             | 4 sample polls for hero                                                   |
| `V0_HOT_DEBATES_BY_TYPE`                   | 7 debates (binary, yesno, multiple, scale, ranking, checkbox, prediction) |
| `V0_COMMUNITY_POSTS`                       | 4 community posts                                                         |
| `V0_USER_POLLS`                            | 3 user-suggested polls                                                    |
| `getHotDebate()`                           | Mock hot debate                                                           |
| `getPollFeed(sort, search, limit, offset)` | Paginated mock feed                                                       |
| `getSuggestedPolls(limit)`                 | Mock suggestions                                                          |
| `getPollById(id)`                          | Full mock poll detail                                                     |
| `getUserVote(pollId)`                      | Returns null                                                              |
| `incrementViewCount(pollId)`               | No-op                                                                     |

---

## Dependency Graph

```
App Routes
├── /polls/page.tsx
│   └── components/polls/home/polls-home-client.tsx
│       ├── components/polls/layout/polls-header.tsx
│       ├── components/polls/home/home-hero.tsx
│       ├── components/polls/home/hot-debate.tsx
│       ├── components/polls/home/poll-list.tsx
│       ├── components/polls/home/user-poll-section.tsx
│       ├── components/polls/home/suggest-section.tsx
│       └── components/polls/home/community-section.tsx
│           └── lib/mock/polls.ts
│
├── /polls/[pollId]/page.tsx
│   └── components/polls/poll/poll-detail-client.tsx
│       ├── components/polls/poll/vote-card.tsx
│       │   ├── app/actions/polls/ (castVote)
│       │   ├── components/polls/poll/interactions/*
│       │   └── lib/validations/poll (CastVoteDto)
│       └── components/polls/types/poll-types.tsx
│
└── /polls/suggest/create/page.tsx
    └── components/polls/suggest/poll-form.tsx
        ├── components/polls/suggest/option-fields.tsx
        ├── app/actions/polls/ (createPoll)
        └── lib/validations/poll (createPollSchema)

Shared
├── lib/validations/poll.ts
├── lib/constants/cache-tags.ts (poll-related tags)
├── lib/constants/messages.ts (poll-related messages)
└── lib/mock/polls.ts
```

---

## Data Flow

### Voting

1. User views poll detail -> `PollDetailClient`
2. `VoteCard` renders interaction component by `interactionType`
3. User selects option(s)
4. `handleVote()` builds `CastVoteDto` (validated by `castVoteSchema`)
5. `castVote()` server action -> DB transaction (create Vote, update counts)
6. Cache invalidation -> toast notification -> page revalidation

### Poll Creation

1. User navigates to `/polls/suggest/create`
2. `PollForm` renders with RHF + Zod
3. User fills title, description, options (2-10), optional sources
4. `createPoll()` server action -> DB transaction
5. Cache invalidation -> toast -> redirect to `/polls`

---

## Files to Comment Out (for removal)

**Pages (18 files):**

- `app/polls/` (entire directory)

**Components (20+ files):**

- `components/polls/` (entire directory)

**Server Actions:**

- `app/actions/polls/` (entire directory)

**Validations:**

- `lib/validations/poll.ts`

**Mock Data:**

- `lib/mock/polls.ts`

**Constants (partial - poll-specific entries in):**

- `lib/constants/cache-tags.ts`
- `lib/constants/messages.ts`
