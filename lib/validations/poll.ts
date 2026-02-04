import { z } from "zod";

/**
 * 선택지 스키마
 */
const pollOptionSchema = z.object({
  text: z.string().min(1, "선택지를 입력해주세요").max(200, "선택지는 200자 이내로 입력해주세요"),
  order: z.number().optional(),
});

/**
 * 출처 스키마
 */
const pollSourceSchema = z.object({
  title: z
    .string()
    .min(1, "출처 제목을 입력해주세요")
    .max(200, "출처 제목은 200자 이내로 입력해주세요"),
  url: z.string().url("유효한 URL을 입력해주세요"),
  sourceType: z.enum(["NEWS", "PAPER", "ARTICLE", "VIDEO", "OTHER"]).optional(),
  description: z.string().max(500, "설명은 500자 이내로 입력해주세요").optional(),
});

/**
 * 여론조사 생성 스키마
 */
export const createPollSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200, "제목은 200자 이내로 입력해주세요"),
  description: z.string().max(2000, "설명은 2000자 이내로 입력해주세요").optional(),
  options: z
    .array(pollOptionSchema)
    .min(2, "최소 2개의 선택지가 필요합니다")
    .max(10, "선택지는 최대 10개까지 추가할 수 있습니다"),
  sources: z.array(pollSourceSchema).optional(),
});

export type CreatePollFormValues = z.infer<typeof createPollSchema>;

/**
 * 여론조사 수정 스키마
 */
export const updatePollSchema = z.object({
  title: z
    .string()
    .min(1, "제목을 입력해주세요")
    .max(200, "제목은 200자 이내로 입력해주세요")
    .optional(),
  description: z.string().max(2000, "설명은 2000자 이내로 입력해주세요").optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).optional(),
});

export type UpdatePollFormValues = z.infer<typeof updatePollSchema>;

/**
 * 투표 스키마
 */
export const castVoteSchema = z.object({
  pollId: z.string().uuid("유효하지 않은 여론조사 ID입니다"),
  optionId: z.string().uuid("유효하지 않은 선택지 ID입니다"),
});

export type CastVoteDto = z.infer<typeof castVoteSchema>;

/**
 * 선택지 추가 스키마 (관리자용)
 */
export const addOptionSchema = z.object({
  pollId: z.string().uuid(),
  text: z.string().min(1, "선택지를 입력해주세요").max(200, "선택지는 200자 이내로 입력해주세요"),
  order: z.number().optional(),
});

export type AddOptionDto = z.infer<typeof addOptionSchema>;

/**
 * 출처 추가 스키마
 */
export const addSourceSchema = z.object({
  pollId: z.string().uuid(),
  title: z.string().min(1, "출처 제목을 입력해주세요").max(200),
  url: z.string().url("유효한 URL을 입력해주세요"),
  sourceType: z.enum(["NEWS", "PAPER", "ARTICLE", "VIDEO", "OTHER"]).optional(),
  description: z.string().max(500).optional(),
});

export type AddSourceDto = z.infer<typeof addSourceSchema>;
