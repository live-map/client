"use server";

export {};

// [COMMENTED OUT] 여론조사 기능 비활성화 - 여론조사 뮤테이션 서버 액션
// 아래 모든 함수는 여론조사 관련 컴포넌트 (VoteCard, PollForm 등)에서
// 사용되며, 여론조사 기능 비활성화에 따라 함께 비활성화합니다.

// import { revalidatePath, updateTag } from "next/cache";
// import * as Sentry from "@sentry/nextjs";
// import prisma from "@/lib/prisma";
// import { withAuth } from "@/lib/auth";
// import { CACHE_TAGS } from "@/lib/constants/cache-tags";
// import { ERROR_MESSAGES } from "@/lib/constants/messages";
// import { createPollSchema, updatePollSchema, castVoteSchema } from "@/lib/validations/poll";
// import type { ActionResult } from "@/lib/types/actions";
// import type { Poll, Vote } from "@/lib/generated/prisma/client";
// import type {
//   CreatePollFormValues,
//   UpdatePollFormValues,
//   CastVoteDto,
// } from "@/lib/validations/poll";
//
// /**
//  * 투표하기 (인터랙션 타입별 분기)
//  */
// export const castVote = withAuth(async (ctx, dto: CastVoteDto): Promise<ActionResult<Vote>> => {
//   try {
//     const validation = castVoteSchema.safeParse(dto);
//     if (!validation.success) {
//       return { error: validation.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT };
//     }
//
//     const { pollId } = dto;
//
//     // 여론조사 존재 여부 및 상태 확인
//     const poll = await prisma.poll.findUnique({
//       where: { id: pollId },
//       include: { options: { select: { id: true } } },
//     });
//
//     if (!poll) {
//       return { error: ERROR_MESSAGES.POLL_NOT_FOUND };
//     }
//
//     if (poll.status !== "ACTIVE") {
//       return { error: ERROR_MESSAGES.POLL_NOT_ACTIVE };
//     }
//
//     // 이미 투표했는지 확인
//     const existingVote = await prisma.vote.findUnique({
//       where: {
//         userId_pollId: {
//           userId: ctx.user.id,
//           pollId,
//         },
//       },
//     });
//
//     if (existingVote) {
//       return { error: ERROR_MESSAGES.POLL_ALREADY_VOTED };
//     }
//
//     const optionIds = new Set(poll.options.map((o) => o.id));
//
//     // 인터랙션 타입별 투표 처리
//     let vote: Vote;
//
//     switch (dto.interactionType) {
//       case "SINGLE_CHOICE":
//       case "BINARY":
//       case "EMOJI_REACTION": {
//         if (!optionIds.has(dto.optionId)) {
//           return { error: ERROR_MESSAGES.POLL_OPTION_INVALID };
//         }
//
//         vote = await prisma.$transaction(async (tx) => {
//           const newVote = await tx.vote.create({
//             data: {
//               userId: ctx.user.id,
//               pollId,
//               optionId: dto.optionId,
//             },
//           });
//           await tx.pollOption.update({
//             where: { id: dto.optionId },
//             data: { voteCount: { increment: 1 } },
//           });
//           await tx.poll.update({
//             where: { id: pollId },
//             data: { totalVotes: { increment: 1 } },
//           });
//           return newVote;
//         });
//         break;
//       }
//
//       case "SLIDER": {
//         vote = await prisma.$transaction(async (tx) => {
//           const newVote = await tx.vote.create({
//             data: {
//               userId: ctx.user.id,
//               pollId,
//               sliderValue: dto.sliderValue,
//             },
//           });
//           await tx.poll.update({
//             where: { id: pollId },
//             data: { totalVotes: { increment: 1 } },
//           });
//           return newVote;
//         });
//         break;
//       }
//
//       case "MULTIPLE_CHOICE": {
//         // 선택된 옵션이 모두 유효한지 확인
//         for (const id of dto.selectedOptionIds) {
//           if (!optionIds.has(id)) {
//             return { error: ERROR_MESSAGES.POLL_OPTION_INVALID };
//           }
//         }
//
//         vote = await prisma.$transaction(async (tx) => {
//           const newVote = await tx.vote.create({
//             data: {
//               userId: ctx.user.id,
//               pollId,
//               selectedOptionIds: dto.selectedOptionIds,
//             },
//           });
//           // 선택된 각 옵션의 투표수 증가
//           for (const id of dto.selectedOptionIds) {
//             await tx.pollOption.update({
//               where: { id },
//               data: { voteCount: { increment: 1 } },
//             });
//           }
//           await tx.poll.update({
//             where: { id: pollId },
//             data: { totalVotes: { increment: 1 } },
//           });
//           return newVote;
//         });
//         break;
//       }
//
//       case "RANKING": {
//         // 랭킹 데이터의 모든 옵션이 유효한지 확인
//         for (const id of dto.rankingData) {
//           if (!optionIds.has(id)) {
//             return { error: ERROR_MESSAGES.POLL_OPTION_INVALID };
//           }
//         }
//
//         vote = await prisma.$transaction(async (tx) => {
//           const newVote = await tx.vote.create({
//             data: {
//               userId: ctx.user.id,
//               pollId,
//               rankingData: dto.rankingData,
//             },
//           });
//           // 1위 옵션의 투표수 증가 (대표 집계용)
//           if (dto.rankingData[0]) {
//             await tx.pollOption.update({
//               where: { id: dto.rankingData[0] },
//               data: { voteCount: { increment: 1 } },
//             });
//           }
//           await tx.poll.update({
//             where: { id: pollId },
//             data: { totalVotes: { increment: 1 } },
//           });
//           return newVote;
//         });
//         break;
//       }
//     }
//
//     // 캐시 무효화
//     updateTag(CACHE_TAGS.POLLS);
//     updateTag(CACHE_TAGS.POLL(pollId));
//     updateTag(CACHE_TAGS.TRENDING_POLLS);
//     updateTag(CACHE_TAGS.USER_VOTES(ctx.user.id));
//     revalidatePath("/polls");
//     revalidatePath(`/polls/${pollId}`);
//
//     return { data: vote };
//   } catch (error) {
//     Sentry.captureException(error, { tags: { action: "castVote" } });
//     return { error: ERROR_MESSAGES.REQUEST_ERROR };
//   }
// });
//
// /**
//  * 여론조사 제안 생성
//  */
// export const createPoll = withAuth(
//   async (ctx, dto: CreatePollFormValues): Promise<ActionResult<Poll>> => {
//     try {
//       const validation = createPollSchema.safeParse(dto);
//       if (!validation.success) {
//         return { error: validation.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT };
//       }
//
//       const { title, description, options, sources } = dto;
//
//       const poll = await prisma.poll.create({
//         data: {
//           title,
//           description,
//           type: "SUGGESTED",
//           status: "ACTIVE", // 제안은 바로 활성화
//           userId: ctx.user.id,
//           options: {
//             create: options.map((opt, index) => ({
//               text: opt.text,
//               order: opt.order ?? index,
//             })),
//           },
//           sources: sources
//             ? {
//                 create: sources.map((src) => ({
//                   title: src.title,
//                   url: src.url,
//                   sourceType: src.sourceType ?? "OTHER",
//                   description: src.description,
//                 })),
//               }
//             : undefined,
//         },
//         include: {
//           options: true,
//           sources: true,
//         },
//       });
//
//       // 캐시 무효화
//       updateTag(CACHE_TAGS.POLLS);
//       updateTag(CACHE_TAGS.SUGGESTED_POLLS);
//       updateTag(CACHE_TAGS.USER_POLLS(ctx.user.id));
//       revalidatePath("/polls");
//       revalidatePath("/polls/suggest");
//
//       return { data: poll };
//     } catch (error) {
//       Sentry.captureException(error, { tags: { action: "createPoll" } });
//       return { error: ERROR_MESSAGES.REQUEST_ERROR };
//     }
//   }
// );
//
// /**
//  * 여론조사 수정
//  */
// export const updatePoll = withAuth(
//   async (ctx, id: string, dto: UpdatePollFormValues): Promise<ActionResult<Poll>> => {
//     try {
//       const validation = updatePollSchema.safeParse(dto);
//       if (!validation.success) {
//         return { error: validation.error.issues[0]?.message ?? ERROR_MESSAGES.INVALID_INPUT };
//       }
//
//       // 소유권 확인
//       const existingPoll = await prisma.poll.findUnique({
//         where: { id },
//         select: { userId: true },
//       });
//
//       if (!existingPoll) {
//         return { error: ERROR_MESSAGES.POLL_NOT_FOUND };
//       }
//
//       if (existingPoll.userId !== ctx.user.id) {
//         return { error: ERROR_MESSAGES.POLL_OWNER_ONLY };
//       }
//
//       const poll = await prisma.poll.update({
//         where: { id },
//         data: dto,
//       });
//
//       // 캐시 무효화
//       updateTag(CACHE_TAGS.POLLS);
//       updateTag(CACHE_TAGS.POLL(id));
//       updateTag(CACHE_TAGS.USER_POLLS(ctx.user.id));
//       updateTag(CACHE_TAGS.TRENDING_POLLS);
//       updateTag(CACHE_TAGS.SUGGESTED_POLLS);
//       revalidatePath("/polls");
//       revalidatePath(`/polls/${id}`);
//
//       return { data: poll };
//     } catch (error) {
//       Sentry.captureException(error, { tags: { action: "updatePoll" } });
//       return { error: ERROR_MESSAGES.REQUEST_ERROR };
//     }
//   }
// );
//
// /**
//  * 여론조사 삭제
//  */
// export const deletePoll = withAuth(async (ctx, id: string): Promise<ActionResult> => {
//   try {
//     // 소유권 확인
//     const existingPoll = await prisma.poll.findUnique({
//       where: { id },
//       select: { userId: true },
//     });
//
//     if (!existingPoll) {
//       return { error: ERROR_MESSAGES.POLL_NOT_FOUND };
//     }
//
//     if (existingPoll.userId !== ctx.user.id) {
//       return { error: ERROR_MESSAGES.POLL_OWNER_ONLY };
//     }
//
//     await prisma.poll.delete({
//       where: { id },
//     });
//
//     // 캐시 무효화
//     updateTag(CACHE_TAGS.POLLS);
//     updateTag(CACHE_TAGS.POLL(id));
//     updateTag(CACHE_TAGS.USER_POLLS(ctx.user.id));
//     updateTag(CACHE_TAGS.TRENDING_POLLS);
//     updateTag(CACHE_TAGS.SUGGESTED_POLLS);
//     revalidatePath("/polls");
//
//     return { data: null };
//   } catch (error) {
//     Sentry.captureException(error, { tags: { action: "deletePoll" } });
//     return { error: ERROR_MESSAGES.REQUEST_ERROR };
//   }
// });
//
// /**
//  * 조회수 증가 (비인증)
//  */
// export async function incrementViewCount(pollId: string): Promise<void> {
//   try {
//     await prisma.poll.update({
//       where: { id: pollId },
//       data: { viewCount: { increment: 1 } },
//     });
//
//     updateTag(CACHE_TAGS.POLL(pollId));
//   } catch (error) {
//     // 조회수 증가 실패는 무시 (중요하지 않음)
//     Sentry.captureException(error, {
//       tags: { action: "incrementViewCount" },
//       level: "warning",
//     });
//   }
// }
