# Code Review Phase 2 — Frontend Changes

## CRITICAL (3건)

| #   | ID  | 파일                       | 변경                                                                 | 상태 |
| --- | --- | -------------------------- | -------------------------------------------------------------------- | ---- |
| 1   | A-7 | `proxy.ts`                 | 보호 라우트 확장 (`/polls/suggest/new`, `/polls/*/edit`), regex 패턴 | DONE |
| 2   | A-8 | `next.config.ts:41-50`     | `hostname: "**"` 2개 제거 (SSRF 방지)                                | DONE |
| 3   | A-9 | `lib/auth/config.ts:32-38` | try/catch 추가 + 기본 role "USER" fallback                           | DONE |

## HIGH + Framework (10건)

| #   | ID        | 파일                               | 변경                                                             | 상태 |
| --- | --------- | ---------------------------------- | ---------------------------------------------------------------- | ---- |
| 4   | B-11+B-12 | `polls/all/page.tsx`               | `offset` stale closure → `useRef`, eslint-disable 제거           | DONE |
| 5   | B-13      | `lib/auth/adapter.ts:72-75`        | `if (fields.length === 0)` 가드 추가                             | DONE |
| 6   | B-14      | `community/post-detail-client.tsx` | `window.confirm()` → Radix Dialog 패턴                           | DONE |
| 7   | B-15      | `polls/[pollId]/edit/page.tsx`     | `useSession()` + 소유자 검증 추가                                | DONE |
| 8   | B-16      | `lib/pg.ts`                        | Pool 연결 제한 (`max: 10, idleTimeoutMillis: 30000`)             | DONE |
| 9   | E-10      | `lib/validations/poll.ts`          | `z.string().uuid()` → `z.guid()`, `z.string().url()` → `z.url()` | DONE |
| 10  | E-11      | 3개 Sentry config 파일             | `tracesSampleRate: 0.1` (프로덕션)                               | DONE |
| 11  | E-12      | `app/globals.css:9`                | `@plugin "tailwindcss-animate"` 제거 (tw-animate-css와 중복)     | DONE |
| 12  | E-13      | `lib/validations/poll.ts`          | `.min(1, "msg")` → `.min(1, { error: "msg" })`                   | DONE |
| 13  | E-17      | `app/providers.tsx`                | `ThemeProvider` 추가 (next-themes 연동)                          | DONE |

## 추가 수정

| #   | ID   | 파일                           | 변경                                               | 상태 |
| --- | ---- | ------------------------------ | -------------------------------------------------- | ---- |
| 14  | E-18 | `instrumentation-client.ts:27` | `typeof window !== "undefined"` 불필요한 가드 제거 | DONE |

## 변경된 파일 목록 (11개)

- `proxy.ts`
- `next.config.ts`
- `lib/auth/config.ts`
- `app/(main)/polls/all/page.tsx`
- `lib/auth/adapter.ts`
- `components/community/post-detail-client.tsx`
- `app/(main)/polls/[pollId]/edit/page.tsx`
- `lib/pg.ts`
- `lib/validations/poll.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation-client.ts`
- `app/globals.css`
- `app/providers.tsx`
