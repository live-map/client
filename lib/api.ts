"use server";

import {
  getFeedsApiV1FeedsGet,
  getFeedApiV1FeedsFeedIdGet,
  startInvestigationApiV1AgentInvestigatePost,
  getInvestigationStatusApiV1AgentStatusInvestigationIdGet,
  triggerScanApiV1AgentScanPost,
  listInvestigationsApiV1AgentInvestigationsGet,
  listPostsApiV1PostsGet,
  getPostApiV1PostsPostIdGet,
  createPostApiV1PostsPost,
  updatePostApiV1PostsPostIdPatch,
  deletePostApiV1PostsPostIdDelete,
  hardDeletePostApiV1PostsPostIdHardDelete,
  likePostApiV1PostsPostIdLikePost,
  unlikePostApiV1PostsPostIdLikeDelete,
  getPostLikersApiV1PostsPostIdLikesGet,
  addMediaToPostApiV1PostsPostIdMediaPost,
  deleteMediaFromPostApiV1PostsPostIdMediaMediaIdDelete,
  listCommentsFlatApiV1CommentsGet,
  listCommentsTreeApiV1CommentsTreeGet,
  getCommentApiV1CommentsCommentIdGet,
  createCommentApiV1CommentsPost,
  updateCommentApiV1CommentsCommentIdPatch,
  deleteCommentApiV1CommentsCommentIdDelete,
  listRepliesApiV1CommentsCommentIdRepliesGet,
  getMediaConfigApiV1MediaConfigGet,
  generatePresignedUrlApiV1MediaPresignedUrlPost,
  healthCheckHealthGet,
} from "@/generated/openapi-client";

import type {
  SortType,
  PostCreate,
  PostUpdate,
  PostMediaCreate,
  CommentCreate,
  CommentUpdate,
  InvestigateRequest,
  ScanRequest,
  PresignedUrlRequest,
} from "@/generated/openapi-client/types.gen";

// ========================================
// Feeds
// ========================================

export const getFeedList = async (
  category: string,
  subCategory?: string,
  limit?: number,
  offset?: number
) => {
  const { data, error } = await getFeedsApiV1FeedsGet({
    query: { category, subCategory, limit, offset },
  });
  return { data, error };
};

export const getFeed = async (feedId: number) => {
  const { data, error } = await getFeedApiV1FeedsFeedIdGet({
    path: { feed_id: feedId },
  });
  return { data, error };
};

// ========================================
// Agent
// ========================================

export const startInvestigation = async (topic: string, category?: string) => {
  const { data, error } = await startInvestigationApiV1AgentInvestigatePost({
    body: { topic, category } as InvestigateRequest,
  });
  return { data, error };
};

export const getInvestigationStatus = async (investigationId: string) => {
  const { data, error } = await getInvestigationStatusApiV1AgentStatusInvestigationIdGet({
    path: { investigation_id: investigationId },
  });
  return { data, error };
};

export const triggerScan = async (sources?: string[], keywords?: string[]) => {
  const { data, error } = await triggerScanApiV1AgentScanPost({
    body: { sources, keywords } as ScanRequest,
  });
  return { data, error };
};

export const listInvestigations = async (status?: string, limit?: number) => {
  const { data, error } = await listInvestigationsApiV1AgentInvestigationsGet({
    query: { status, limit },
  });
  return { data, error };
};

// ========================================
// Posts
// ========================================

export const getPostList = async (
  limit?: number,
  offset?: number,
  sort?: SortType,
  userId?: string
) => {
  const { data, error } = await listPostsApiV1PostsGet({
    query: { limit, offset, sort, user_id: userId },
  });
  return { data, error };
};

export const getPost = async (postId: string) => {
  const { data, error } = await getPostApiV1PostsPostIdGet({
    path: { post_id: postId },
  });
  return { data, error };
};

export const createPost = async (body: PostCreate) => {
  const { data, error } = await createPostApiV1PostsPost({
    body,
  });
  return { data, error };
};

export const updatePost = async (postId: string, body: PostUpdate) => {
  const { data, error } = await updatePostApiV1PostsPostIdPatch({
    path: { post_id: postId },
    body,
  });
  return { data, error };
};

export const deletePost = async (postId: string) => {
  const { data, error } = await deletePostApiV1PostsPostIdDelete({
    path: { post_id: postId },
  });
  return { data, error };
};

export const hardDeletePost = async (postId: string) => {
  const { data, error } = await hardDeletePostApiV1PostsPostIdHardDelete({
    path: { post_id: postId },
  });
  return { data, error };
};

// ========================================
// Post Likes
// ========================================

export const likePost = async (postId: string) => {
  const { data, error } = await likePostApiV1PostsPostIdLikePost({
    path: { post_id: postId },
  });
  return { data, error };
};

export const unlikePost = async (postId: string) => {
  const { data, error } = await unlikePostApiV1PostsPostIdLikeDelete({
    path: { post_id: postId },
  });
  return { data, error };
};

export const getPostLikers = async (postId: string, limit?: number, offset?: number) => {
  const { data, error } = await getPostLikersApiV1PostsPostIdLikesGet({
    path: { post_id: postId },
    query: { limit, offset },
  });
  return { data, error };
};

// ========================================
// Post Media
// ========================================

export const addMediaToPost = async (postId: string, body: PostMediaCreate) => {
  const { data, error } = await addMediaToPostApiV1PostsPostIdMediaPost({
    path: { post_id: postId },
    body,
  });
  return { data, error };
};

export const deleteMediaFromPost = async (postId: string, mediaId: string) => {
  const { data, error } = await deleteMediaFromPostApiV1PostsPostIdMediaMediaIdDelete({
    path: { post_id: postId, media_id: mediaId },
  });
  return { data, error };
};

// ========================================
// Comments
// ========================================

export const getCommentList = async (
  postId?: string,
  userId?: string,
  limit?: number,
  offset?: number
) => {
  const { data, error } = await listCommentsFlatApiV1CommentsGet({
    query: { post_id: postId, user_id: userId, limit, offset },
  });
  return { data, error };
};

export const getCommentTree = async (postId: string) => {
  const { data, error } = await listCommentsTreeApiV1CommentsTreeGet({
    query: { post_id: postId },
  });
  return { data, error };
};

export const getComment = async (commentId: string) => {
  const { data, error } = await getCommentApiV1CommentsCommentIdGet({
    path: { comment_id: commentId },
  });
  return { data, error };
};

export const createComment = async (body: CommentCreate) => {
  const { data, error } = await createCommentApiV1CommentsPost({
    body,
  });
  return { data, error };
};

export const updateComment = async (commentId: string, body: CommentUpdate) => {
  const { data, error } = await updateCommentApiV1CommentsCommentIdPatch({
    path: { comment_id: commentId },
    body,
  });
  return { data, error };
};

export const deleteComment = async (commentId: string) => {
  const { data, error } = await deleteCommentApiV1CommentsCommentIdDelete({
    path: { comment_id: commentId },
  });
  return { data, error };
};

export const getCommentReplies = async (commentId: string, limit?: number) => {
  const { data, error } = await listRepliesApiV1CommentsCommentIdRepliesGet({
    path: { comment_id: commentId },
    query: { limit },
  });
  return { data, error };
};

// ========================================
// Media
// ========================================

export const getMediaConfig = async () => {
  const { data, error } = await getMediaConfigApiV1MediaConfigGet();
  return { data, error };
};

export const generatePresignedUrl = async (body: PresignedUrlRequest) => {
  const { data, error } = await generatePresignedUrlApiV1MediaPresignedUrlPost({
    body,
  });
  return { data, error };
};

// ========================================
// Health
// ========================================

export const healthCheck = async () => {
  const { data, error } = await healthCheckHealthGet();
  return { data, error };
};
