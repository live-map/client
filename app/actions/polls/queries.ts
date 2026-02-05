"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type {
  Poll,
  PollOption,
  PollSource,
  PollComment,
  Vote,
} from "@/lib/generated/prisma/client";

/**
 * 댓글 타입 (유저, 대댓글, 투표 옵션 포함)
 */
export type PollCommentWithDetails = PollComment & {
  user: { id: string; name: string | null; image: string | null };
  option: Pick<PollOption, "id" | "text"> | null;
  replies: (PollComment & {
    user: { id: string; name: string | null; image: string | null };
    option: Pick<PollOption, "id" | "text"> | null;
  })[];
};

/**
 * 여론조사 상세 타입 (옵션, 출처, 댓글 포함)
 */
export type PollWithDetails = Poll & {
  options: PollOption[];
  sources: PollSource[];
  comments: PollCommentWithDetails[];
  user: { id: string; name: string | null; image: string | null };
};

/** select 공통 필드 (PollCardData용) */
const POLL_CARD_SELECT = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  category: true,
  type: true,
  status: true,
  interactionType: true,
  totalVotes: true,
  viewCount: true,
  createdAt: true,
  endsAt: true,
  options: {
    select: { id: true, text: true, voteCount: true },
    orderBy: { order: "asc" as const },
  },
} as const;

/**
 * 홈 피드용 여론조사 타입
 */
export type PollCardData = Pick<
  Poll,
  | "id"
  | "title"
  | "description"
  | "imageUrl"
  | "category"
  | "type"
  | "status"
  | "interactionType"
  | "totalVotes"
  | "viewCount"
  | "createdAt"
  | "endsAt"
> & {
  options: Pick<PollOption, "id" | "text" | "voteCount">[];
  user?: { name: string | null };
};

/**
 * 홈 피드 데이터 조회
 */
export async function getHomeFeed(): Promise<{
  highlight: PollCardData | null;
  trending: PollCardData[];
  suggested: PollCardData[];
}> {
  const [highlight, trending, suggested] = await Promise.all([
    prisma.poll.findFirst({
      where: { status: "ACTIVE", type: "OFFICIAL" },
      orderBy: { totalVotes: "desc" },
      select: POLL_CARD_SELECT,
    }),
    prisma.poll.findMany({
      where: { status: "ACTIVE" },
      orderBy: { totalVotes: "desc" },
      take: 10,
      select: POLL_CARD_SELECT,
    }),
    prisma.poll.findMany({
      where: { status: "ACTIVE", type: "SUGGESTED" },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { ...POLL_CARD_SELECT, user: { select: { name: true } } },
    }),
  ]);

  return { highlight, trending, suggested };
}

/**
 * 실시간 인기 여론조사 조회
 */
export async function getTrendingPolls(limit = 10): Promise<PollCardData[]> {
  return prisma.poll.findMany({
    where: { status: "ACTIVE" },
    orderBy: { totalVotes: "desc" },
    take: limit,
    select: POLL_CARD_SELECT,
  });
}

/**
 * 유저 제안 여론조사 조회 (조회수 순)
 */
export async function getSuggestedPolls(limit = 10): Promise<PollCardData[]> {
  return prisma.poll.findMany({
    where: { status: "ACTIVE", type: "SUGGESTED" },
    orderBy: { viewCount: "desc" },
    take: limit,
    select: { ...POLL_CARD_SELECT, user: { select: { name: true } } },
  });
}

/**
 * 뜨거운 토론 (BINARY ACTIVE 중 가장 접전인 poll)
 */
export type HotDebateData = {
  id: string;
  title: string;
  proLabel: string;
  conLabel: string;
  proPercent: number;
  conPercent: number;
  totalVotes: number;
  comments: {
    id: string;
    author: string;
    content: string;
    side: "pro" | "con";
    likes: number;
  }[];
};

export async function getHotDebate(): Promise<HotDebateData | null> {
  const binaryPolls = await prisma.poll.findMany({
    where: { status: "ACTIVE", interactionType: "BINARY" },
    orderBy: { totalVotes: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      totalVotes: true,
      options: {
        select: { id: true, text: true, voteCount: true },
        orderBy: { order: "asc" },
      },
      comments: {
        take: 10,
        orderBy: { likes: "desc" },
        select: {
          id: true,
          content: true,
          likes: true,
          optionId: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (binaryPolls.length === 0) return null;

  // 가장 접전인 poll 찾기 (percentage 차이가 가장 작은 것)
  let bestPoll = binaryPolls[0]!;
  let minDiff = Infinity;

  for (const poll of binaryPolls) {
    if (poll.options.length < 2 || poll.totalVotes === 0) continue;
    const pctA = (poll.options[0]!.voteCount / poll.totalVotes) * 100;
    const pctB = (poll.options[1]!.voteCount / poll.totalVotes) * 100;
    const diff = Math.abs(pctA - pctB);
    if (diff < minDiff) {
      minDiff = diff;
      bestPoll = poll;
    }
  }

  const optionA = bestPoll.options[0];
  const optionB = bestPoll.options[1];
  if (!optionA || !optionB) return null;

  const total = bestPoll.totalVotes || 1;
  const proPercent = Math.round((optionA.voteCount / total) * 1000) / 10;
  const conPercent = Math.round((optionB.voteCount / total) * 1000) / 10;

  return {
    id: bestPoll.id,
    title: bestPoll.title,
    proLabel: optionA.text,
    conLabel: optionB.text,
    proPercent,
    conPercent,
    totalVotes: bestPoll.totalVotes,
    comments: bestPoll.comments.map((c) => ({
      id: c.id,
      author: c.user.name ?? "익명",
      content: c.content,
      side: c.optionId === optionA.id ? ("pro" as const) : ("con" as const),
      likes: c.likes,
    })),
  };
}

/**
 * 여론조사 상세 조회 (댓글 포함)
 */
export async function getPollById(id: string): Promise<PollWithDetails | null> {
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      options: { orderBy: { order: "asc" } },
      sources: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, image: true } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, image: true } },
          option: { select: { id: true, text: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { id: true, name: true, image: true } },
              option: { select: { id: true, text: true } },
            },
          },
        },
      },
    },
  });

  return poll as PollWithDetails | null;
}

/**
 * 사용자의 투표 여부 확인
 */
export type UserVoteData = Pick<
  Vote,
  "id" | "optionId" | "sliderValue" | "selectedOptionIds" | "rankingData"
>;

export async function getUserVote(pollId: string): Promise<UserVoteData | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const vote = await prisma.vote.findUnique({
    where: {
      userId_pollId: {
        userId: session.user.id,
        pollId,
      },
    },
    select: {
      id: true,
      optionId: true,
      sliderValue: true,
      selectedOptionIds: true,
      rankingData: true,
    },
  });

  return vote;
}

/**
 * 사용자가 투표한 여론조사 목록
 */
export async function getUserVotedPolls(): Promise<PollCardData[]> {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const votes = await prisma.vote.findMany({
    where: { userId: session.user.id },
    include: {
      poll: {
        select: POLL_CARD_SELECT,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return votes.map((v) => v.poll);
}

/**
 * 사용자가 제안한 여론조사 목록
 */
export async function getUserPolls(): Promise<PollCardData[]> {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  return prisma.poll.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: POLL_CARD_SELECT,
  });
}

/**
 * 피드 정렬 모드
 */
export type PollSortMode = "popular" | "recent" | "ending_soon" | "closed";

/**
 * 홈 피드용 여론조사 목록 (정렬 + 검색 + 오프셋 페이징)
 */
export async function getPollFeed(
  sort: PollSortMode = "popular",
  search?: string,
  limit = 20,
  offset = 0
): Promise<PollCardData[]> {
  const now = new Date();

  const searchFilter = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  let where: Record<string, unknown>;
  let orderBy: Record<string, string>;

  switch (sort) {
    case "recent":
      where = { status: "ACTIVE", ...searchFilter };
      orderBy = { createdAt: "desc" };
      break;
    case "ending_soon":
      where = { status: "ACTIVE", endsAt: { gt: now }, ...searchFilter };
      orderBy = { endsAt: "asc" };
      break;
    case "closed":
      where = { status: "CLOSED", ...searchFilter };
      orderBy = { createdAt: "desc" };
      break;
    case "popular":
    default:
      where = { status: "ACTIVE", ...searchFilter };
      orderBy = { totalVotes: "desc" };
      break;
  }

  return prisma.poll.findMany({
    where,
    orderBy,
    take: limit,
    skip: offset,
    select: POLL_CARD_SELECT,
  });
}
