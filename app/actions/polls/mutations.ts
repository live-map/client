"use server";

import {
  castVote as apiCastVote,
  createPoll as apiCreatePoll,
  updatePoll as apiUpdatePoll,
  deletePoll as apiDeletePoll,
  incrementPollViewCount as apiIncrementViewCount,
} from "@/lib/api";

// ========================================
// Types
// ========================================

type ActionResult<T = null> = { data?: T; error?: string };

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
}): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const { data, error } = await apiCastVote(dto.pollId, {
      interactionType: dto.interactionType,
      optionId: dto.optionId,
      sliderValue: dto.sliderValue,
      selectedOptionIds: dto.selectedOptionIds,
      rankingData: dto.rankingData,
    });

    if (error) {
      return { error };
    }

    return { data: data as Record<string, unknown> };
  } catch {
    return { error: "투표 처리 중 오류가 발생했습니다." };
  }
}

/**
 * 여론조사 제안 생성
 */
export async function createPoll(dto: {
  title: string;
  description?: string;
  interactionType?: string;
  options: { text: string; order?: number }[];
  sources?: { title: string; url: string; sourceType?: string; description?: string }[];
}): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const { data, error } = await apiCreatePoll({
      title: dto.title,
      description: dto.description,
      interactionType: dto.interactionType || "SINGLE_CHOICE",
      options: dto.options,
      sources: dto.sources,
    });

    if (error) {
      return { error };
    }

    return { data: data as Record<string, unknown> };
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
): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const { data, error } = await apiUpdatePoll(id, dto);

    if (error) {
      return { error };
    }

    return { data: data as Record<string, unknown> };
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

    return { data: null };
  } catch {
    return { error: "여론조사 삭제 중 오류가 발생했습니다." };
  }
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
