"use server";

import { updateTag } from "next/cache";
import {
  castVote as apiCastVote,
  createPoll as apiCreatePoll,
  updatePoll as apiUpdatePoll,
  deletePoll as apiDeletePoll,
  incrementPollViewCount as apiIncrementViewCount,
  createPollComment as apiCreatePollComment,
  likePollComment as apiLikePollComment,
  deletePollComment as apiDeletePollComment,
} from "@/lib/api";

// ========================================
// Types
// ========================================

type ActionResult<T = null> = { data?: T; error?: string; status?: number };

// ========================================
// Error message helpers
// ========================================

function getVoteErrorMessage(status: number | undefined, fallback: string): string {
  switch (status) {
    case 401:
      return "로그인이 필요합니다";
    case 409:
      return "이미 투표하셨습니다";
    case 404:
      return "존재하지 않는 여론조사입니다";
    case 400:
      return fallback;
    default:
      return fallback;
  }
}

function getCommentErrorMessage(status: number | undefined, fallback: string): string {
  switch (status) {
    case 401:
      return "로그인이 필요합니다";
    case 404:
      return "존재하지 않는 여론조사입니다";
    case 400:
      return fallback;
    default:
      return fallback;
  }
}

// ========================================
// Mutations (API 호출)
// ========================================

/**
 * 투표하기 (인터랙션 타입별 분기)
 */
export async function castVote(dto: {
  pollId: string;
  interactionType: string;
  optionId?: string;
  sliderValue?: number;
  selectedOptionIds?: string[];
  rankingData?: string[];
}): Promise<ActionResult> {
  try {
    const { error, status } = await apiCastVote(dto.pollId, {
      interactionType: dto.interactionType,
      optionId: dto.optionId,
      sliderValue: dto.sliderValue,
      selectedOptionIds: dto.selectedOptionIds,
      rankingData: dto.rankingData,
    });

    if (error) {
      return { error: getVoteErrorMessage(status, error), status };
    }

    updateTag(`poll-${dto.pollId}`);
    updateTag("polls");
    return {};
  } catch {
    return { error: "서버 연결에 실패했습니다" };
  }
}

/**
 * 여론조사 댓글 작성
 */
export async function createPollComment(
  pollId: string,
  dto: { content: string; parentId?: string; optionId?: string }
): Promise<ActionResult> {
  try {
    const { error, status } = await apiCreatePollComment(pollId, dto);

    if (error) {
      return { error: getCommentErrorMessage(status, error), status };
    }

    updateTag(`poll-${pollId}`);
    return {};
  } catch {
    return { error: "서버 연결에 실패했습니다" };
  }
}

/**
 * 여론조사 제안 생성
 */
export async function createPoll(dto: {
  title: string;
  description?: string;
  interactionType?: string;
  category?: string;
  options: { text: string; order?: number }[];
  sources?: { title: string; url: string; sourceType?: string; description?: string }[];
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { data, error } = await apiCreatePoll({
      title: dto.title,
      description: dto.description,
      interactionType: dto.interactionType || "SINGLE_CHOICE",
      category: dto.category,
      options: dto.options,
      sources: dto.sources,
    });

    if (error) {
      return { error };
    }

    updateTag("polls");
    const poll = data as { id: string } | null;
    return { data: poll ? { id: poll.id } : undefined };
  } catch {
    return { error: "여론조사 생성 중 오류가 발생했습니다." };
  }
}

/**
 * 여론조사 수정
 */
export async function updatePoll(
  id: string,
  dto: { title?: string; description?: string; status?: string }
): Promise<ActionResult> {
  try {
    const { error } = await apiUpdatePoll(id, dto);

    if (error) {
      return { error };
    }

    updateTag(`poll-${id}`);
    updateTag("polls");
    return {};
  } catch {
    return { error: "여론조사 수정 중 오류가 발생했습니다." };
  }
}

/**
 * 여론조사 삭제
 */
export async function deletePoll(id: string): Promise<ActionResult> {
  try {
    const { error } = await apiDeletePoll(id);

    if (error) {
      return { error };
    }

    updateTag("polls");
    return { data: null };
  } catch {
    return { error: "여론조사 삭제 중 오류가 발생했습니다." };
  }
}

/**
 * 폴 캐시 무효화 (리서치 완료 시 호출)
 */
export async function revalidatePoll(pollId: string): Promise<void> {
  updateTag(`poll-${pollId}`);
  updateTag("polls");
}

/**
 * 조회수 증가 (비인증)
 */
export async function incrementViewCount(pollId: string): Promise<void> {
  try {
    await apiIncrementViewCount(pollId);
  } catch {
    // 조회수 증가 실패는 무시
  }
}

/**
 * 댓글 좋아요
 */
export async function likePollComment(
  pollId: string,
  commentId: string
): Promise<ActionResult<{ likes: number }>> {
  try {
    const { data, error, status } = await apiLikePollComment(pollId, commentId);
    if (error) {
      return { error: getCommentErrorMessage(status, error), status };
    }
    updateTag(`poll-${pollId}`);
    return { data: data as { likes: number } };
  } catch {
    return { error: "서버 연결에 실패했습니다" };
  }
}

/**
 * 댓글 삭제
 */
export async function deletePollComment(pollId: string, commentId: string): Promise<ActionResult> {
  try {
    const { error, status } = await apiDeletePollComment(pollId, commentId);
    if (error) {
      return { error: getCommentErrorMessage(status, error), status };
    }
    updateTag(`poll-${pollId}`);
    return { data: null };
  } catch {
    return { error: "댓글 삭제 중 오류가 발생했습니다" };
  }
}
