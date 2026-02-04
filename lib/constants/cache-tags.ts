/**
 * 캐시 태그 상수
 *
 * updateTag()와 함께 사용하여 효율적인 캐시 무효화를 수행합니다.
 * (Next.js 16에서 revalidateTag는 두 번째 파라미터가 필수입니다. updateTag 사용 권장)
 *
 * @example
 * ```typescript
 * // Server Action에서 사용
 * import { updateTag } from "next/cache";
 * import { CACHE_TAGS } from "@/lib/constants/cache-tags";
 *
 * export async function createItem(title: string) {
 *   const item = await prisma.item.create({ ... });
 *   updateTag(CACHE_TAGS.ITEMS);
 *   return { data: item };
 * }
 *
 * // 데이터 페칭에서 사용 (fetch)
 * const items = await fetch(url, {
 *   next: { tags: [CACHE_TAGS.ITEMS] }
 * });
 * ```
 */
export const CACHE_TAGS = {
  /** 전체 아이템 목록 */
  ITEMS: "items",

  /** 특정 아이템 상세 */
  ITEM: (id: string) => `item-${id}` as const,

  /** 사용자별 아이템 목록 */
  USER_ITEMS: (userId: string) => `user-items-${userId}` as const,

  // ===========================================
  // Grapoll: 여론조사 캐시 태그
  // ===========================================

  /** 전체 여론조사 목록 */
  POLLS: "polls",

  /** 특정 여론조사 상세 */
  POLL: (id: string) => `poll-${id}` as const,

  /** 사용자별 여론조사 목록 */
  USER_POLLS: (userId: string) => `user-polls-${userId}` as const,

  /** 사용자별 투표 목록 */
  USER_VOTES: (userId: string) => `user-votes-${userId}` as const,

  /** 인기 여론조사 */
  TRENDING_POLLS: "trending-polls",

  /** 제안 여론조사 */
  SUGGESTED_POLLS: "suggested-polls",

  /** 여론조사 피드 */
  POLL_FEED: "poll-feed",
} as const;
