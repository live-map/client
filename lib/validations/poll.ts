import { z } from "zod";

/**
 * 선택지 스키마
 */
const pollOptionSchema = z.object({
  text: z
    .string()
    .min(1, { error: "선택지를 입력해주세요" })
    .max(200, { error: "선택지는 200자 이내로 입력해주세요" }),
  order: z.number().optional(),
});

/**
 * 출처 스키마
 */
const pollSourceSchema = z.object({
  title: z
    .string()
    .min(1, { error: "출처 제목을 입력해주세요" })
    .max(200, { error: "출처 제목은 200자 이내로 입력해주세요" }),
  url: z.url({ error: "유효한 URL을 입력해주세요" }),
  sourceType: z.enum(["NEWS", "PAPER", "ARTICLE", "VIDEO", "OTHER"]).optional(),
  description: z.string().max(500, { error: "설명은 500자 이내로 입력해주세요" }).optional(),
});

/**
 * 인터랙션 타입
 */
export const interactionTypes = [
  "SINGLE_CHOICE",
  "BINARY",
  "MULTIPLE_CHOICE",
  "SLIDER",
  "RANKING",
  "EMOJI_REACTION",
] as const;

export type InteractionType = (typeof interactionTypes)[number];

/**
 * 카테고리 목록
 */
export const pollCategories = [
  "정치",
  "경제",
  "사회",
  "기술",
  "환경",
  "문화",
  "스포츠",
  "기타",
] as const;

/**
 * 여론조사 생성 스키마
 */
export const createPollSchema = z
  .object({
    title: z
      .string()
      .min(1, { error: "제목을 입력해주세요" })
      .max(200, { error: "제목은 200자 이내로 입력해주세요" }),
    description: z.string().max(2000, { error: "설명은 2000자 이내로 입력해주세요" }).optional(),
    interactionType: z.enum([
      "SINGLE_CHOICE",
      "BINARY",
      "MULTIPLE_CHOICE",
      "SLIDER",
      "RANKING",
      "EMOJI_REACTION",
    ]),
    category: z.string().optional(),
    options: z
      .array(pollOptionSchema)
      .max(10, { error: "선택지는 최대 10개까지 추가할 수 있습니다" }),
    sources: z.array(pollSourceSchema).optional(),
  })
  .refine((data) => data.interactionType === "SLIDER" || data.options.length >= 2, {
    message: "최소 2개의 선택지가 필요합니다",
    path: ["options"],
  });

export type CreatePollFormValues = z.infer<typeof createPollSchema>;

/**
 * 여론조사 수정 스키마
 */
export const updatePollSchema = z.object({
  title: z
    .string()
    .min(1, { error: "제목을 입력해주세요" })
    .max(200, { error: "제목은 200자 이내로 입력해주세요" })
    .optional(),
  description: z.string().max(2000, { error: "설명은 2000자 이내로 입력해주세요" }).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).optional(),
});

export type UpdatePollFormValues = z.infer<typeof updatePollSchema>;

/**
 * 투표 스키마 (인터랙션 타입별 discriminated union)
 */
const singleChoiceVoteSchema = z.object({
  pollId: z.guid({ error: "유효하지 않은 여론조사 ID입니다" }),
  interactionType: z.literal("SINGLE_CHOICE"),
  optionId: z.guid({ error: "유효하지 않은 선택지 ID입니다" }),
});

const binaryVoteSchema = z.object({
  pollId: z.guid({ error: "유효하지 않은 여론조사 ID입니다" }),
  interactionType: z.literal("BINARY"),
  optionId: z.guid({ error: "유효하지 않은 선택지 ID입니다" }),
});

const emojiVoteSchema = z.object({
  pollId: z.guid({ error: "유효하지 않은 여론조사 ID입니다" }),
  interactionType: z.literal("EMOJI_REACTION"),
  optionId: z.guid({ error: "유효하지 않은 선택지 ID입니다" }),
});

const sliderVoteSchema = z.object({
  pollId: z.guid({ error: "유효하지 않은 여론조사 ID입니다" }),
  interactionType: z.literal("SLIDER"),
  sliderValue: z.number().min(0).max(100),
});

const multipleChoiceVoteSchema = z.object({
  pollId: z.guid({ error: "유효하지 않은 여론조사 ID입니다" }),
  interactionType: z.literal("MULTIPLE_CHOICE"),
  selectedOptionIds: z.array(z.guid()).min(1, { error: "최소 1개 이상 선택해주세요" }),
});

const rankingVoteSchema = z.object({
  pollId: z.guid({ error: "유효하지 않은 여론조사 ID입니다" }),
  interactionType: z.literal("RANKING"),
  rankingData: z.array(z.guid()).min(2, { error: "최소 2개 항목의 순위를 매겨주세요" }),
});

export const castVoteSchema = z.discriminatedUnion("interactionType", [
  singleChoiceVoteSchema,
  binaryVoteSchema,
  emojiVoteSchema,
  sliderVoteSchema,
  multipleChoiceVoteSchema,
  rankingVoteSchema,
]);

export type CastVoteDto = z.infer<typeof castVoteSchema>;

/**
 * 선택지 추가 스키마 (관리자용)
 */
export const addOptionSchema = z.object({
  pollId: z.guid(),
  text: z
    .string()
    .min(1, { error: "선택지를 입력해주세요" })
    .max(200, { error: "선택지는 200자 이내로 입력해주세요" }),
  order: z.number().optional(),
});

export type AddOptionDto = z.infer<typeof addOptionSchema>;

/**
 * 출처 추가 스키마
 */
export const addSourceSchema = z.object({
  pollId: z.guid(),
  title: z.string().min(1, { error: "출처 제목을 입력해주세요" }).max(200),
  url: z.url({ error: "유효한 URL을 입력해주세요" }),
  sourceType: z.enum(["NEWS", "PAPER", "ARTICLE", "VIDEO", "OTHER"]).optional(),
  description: z.string().max(500).optional(),
});

export type AddSourceDto = z.infer<typeof addSourceSchema>;
