"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Poll, PollOption, PollSource, Vote } from "@/lib/generated/prisma/client";

/**
 * 여론조사 상세 타입 (옵션, 출처 포함)
 */
export type PollWithDetails = Poll & {
  options: PollOption[];
  sources: PollSource[];
  user: { id: string; name: string | null; image: string | null };
};

/**
 * 홈 피드용 여론조사 타입
 */
export type PollCardData = Pick<
  Poll,
  "id" | "title" | "description" | "type" | "status" | "totalVotes" | "viewCount" | "createdAt"
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
    // 하이라이트: 가장 많은 투표수를 가진 활성 공식 여론조사
    prisma.poll.findFirst({
      where: {
        status: "ACTIVE",
        type: "OFFICIAL",
      },
      orderBy: { totalVotes: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        totalVotes: true,
        viewCount: true,
        createdAt: true,
        options: {
          select: { id: true, text: true, voteCount: true },
          orderBy: { order: "asc" },
        },
      },
    }),

    // 실시간 인기: 최근 투표가 많은 활성 여론조사
    prisma.poll.findMany({
      where: { status: "ACTIVE" },
      orderBy: { totalVotes: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        totalVotes: true,
        viewCount: true,
        createdAt: true,
        options: {
          select: { id: true, text: true, voteCount: true },
          orderBy: { order: "asc" },
        },
      },
    }),

    // 유저 제안: 조회수 순
    prisma.poll.findMany({
      where: {
        status: "ACTIVE",
        type: "SUGGESTED",
      },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        totalVotes: true,
        viewCount: true,
        createdAt: true,
        options: {
          select: { id: true, text: true, voteCount: true },
          orderBy: { order: "asc" },
        },
        user: { select: { name: true } },
      },
    }),
  ]);

  return { highlight, trending, suggested };
}

/**
 * 실시간 인기 여론조사 조회
 */
export async function getTrendingPolls(limit = 10): Promise<PollCardData[]> {
  const polls = await prisma.poll.findMany({
    where: { status: "ACTIVE" },
    orderBy: { totalVotes: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      status: true,
      totalVotes: true,
      viewCount: true,
      createdAt: true,
      options: {
        select: { id: true, text: true, voteCount: true },
        orderBy: { order: "asc" },
      },
    },
  });

  return polls;
}

/**
 * 유저 제안 여론조사 조회 (조회수 순)
 */
export async function getSuggestedPolls(limit = 10): Promise<PollCardData[]> {
  const polls = await prisma.poll.findMany({
    where: {
      status: "ACTIVE",
      type: "SUGGESTED",
    },
    orderBy: { viewCount: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      status: true,
      totalVotes: true,
      viewCount: true,
      createdAt: true,
      options: {
        select: { id: true, text: true, voteCount: true },
        orderBy: { order: "asc" },
      },
      user: { select: { name: true } },
    },
  });

  return polls;
}

/**
 * 여론조사 상세 조회
 */
export async function getPollById(id: string): Promise<PollWithDetails | null> {
  const poll = await prisma.poll.findUnique({
    where: { id },
    include: {
      options: { orderBy: { order: "asc" } },
      sources: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return poll;
}

/**
 * 사용자의 투표 여부 확인
 */
export async function getUserVote(pollId: string): Promise<Vote | null> {
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
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          totalVotes: true,
          viewCount: true,
          createdAt: true,
          options: {
            select: { id: true, text: true, voteCount: true },
            orderBy: { order: "asc" },
          },
        },
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

  const polls = await prisma.poll.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      status: true,
      totalVotes: true,
      viewCount: true,
      createdAt: true,
      options: {
        select: { id: true, text: true, voteCount: true },
        orderBy: { order: "asc" },
      },
    },
  });

  return polls;
}
