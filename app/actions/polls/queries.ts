"use server";

import {
  getPollFeed as apiGetPollFeed,
  getHotDebate as apiGetHotDebate,
  getSuggestedPolls as apiGetSuggestedPolls,
  getPollById as apiGetPollById,
  getUserVote as apiGetUserVote,
} from "@/lib/api";
import {
  getHotDebate as mockGetHotDebate,
  getPollFeed as mockGetPollFeed,
  getSuggestedPolls as mockGetSuggestedPolls,
  getPollById as mockGetPollById,
  getUserVote as mockGetUserVote,
} from "@/lib/mock/polls";

// ========================================
// Types (프론트엔드 컴포넌트에서 사용하는 타입)
// ========================================

export type PollCardData = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  type: string;
  status: string;
  interactionType: string;
  totalVotes: number;
  viewCount: number;
  createdAt: Date;
  endsAt: Date | null;
  options: { id: string; text: string; voteCount: number }[];
  user?: { name: string | null };
};

export type PollSortMode = "popular" | "recent" | "ending_soon" | "closed";

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

export type PollCommentData = {
  id: string;
  content: string;
  likes: number;
  userId: string;
  pollId: string;
  parentId: string | null;
  optionId: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; image: string | null } | null;
  option: { id: string; text: string } | null;
  replies?: PollCommentData[];
};

export type PollWithDetails = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  type: string;
  status: string;
  interactionType: string;
  totalVotes: number;
  viewCount: number;
  createdAt: string;
  endsAt: string | null;
  userId: string;
  aiContent: string | null;
  aiUpdatedAt: string | null;
  options: { id: string; text: string; order: number; voteCount: number }[];
  sources: {
    id: string;
    title: string;
    url: string;
    sourceType: string;
    description: string | null;
  }[];
  comments: PollCommentData[];
  user: { id: string | null; name: string | null; image: string | null } | null;
  averageSliderValue: number | null;
};

export type UserVoteData = {
  id: string;
  optionId: string | null;
  sliderValue: number | null;
  selectedOptionIds: string[] | null;
  rankingData: string[] | null;
};

// ========================================
// Queries (API 호출 + mock fallback)
// ========================================

/**
 * 여론조사 피드 목록 (정렬 + 검색 + 오프셋 페이징)
 */
export async function getPollFeed(
  sort: PollSortMode = "popular",
  search?: string,
  limit = 20,
  offset = 0
): Promise<PollCardData[]> {
  try {
    const { data, error } = await apiGetPollFeed(sort, search, limit, offset);
    if (error || !data) {
      return mockGetPollFeed(sort, search, limit, offset);
    }
    return (data as { items: PollCardData[] }).items ?? (data as PollCardData[]);
  } catch {
    return mockGetPollFeed(sort, search, limit, offset);
  }
}

/**
 * 뜨거운 토론 (BINARY 접전)
 */
export async function getHotDebate(): Promise<HotDebateData | null> {
  try {
    const { data, error } = await apiGetHotDebate();
    if (error || !data) {
      return mockGetHotDebate();
    }
    return data as HotDebateData;
  } catch {
    return mockGetHotDebate();
  }
}

/**
 * 유저 제안 여론조사 목록
 */
export async function getSuggestedPolls(limit = 10): Promise<PollCardData[]> {
  try {
    const { data, error } = await apiGetSuggestedPolls(limit);
    if (error || !data) {
      return mockGetSuggestedPolls(limit);
    }
    return data as PollCardData[];
  } catch {
    return mockGetSuggestedPolls(limit);
  }
}

/**
 * 여론조사 상세 조회
 */
export async function getPollById(id: string): Promise<PollWithDetails | null> {
  try {
    const { data, error } = await apiGetPollById(id);
    if (error || !data) {
      return mockGetPollById(id);
    }
    return data as PollWithDetails;
  } catch {
    return mockGetPollById(id);
  }
}

/**
 * 사용자의 투표 여부 확인
 */
export async function getUserVote(pollId: string): Promise<UserVoteData | null> {
  try {
    const { data, error } = await apiGetUserVote(pollId);
    if (error || !data) {
      return mockGetUserVote(pollId);
    }
    return data as UserVoteData;
  } catch {
    return mockGetUserVote(pollId);
  }
}
