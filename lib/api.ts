"use server";

import { cookies } from "next/headers";

import {
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
  PresignedUrlRequest,
} from "@/generated/openapi-client/types.gen";

// ========================================
// Backend Base URL (for poll endpoints until openapi-client is regenerated)
// ========================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token";

async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null; status?: number }> {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: body.detail || `HTTP ${res.status}`, status: res.status };
    }
    // 204 No Content
    if (res.status === 204) {
      return { data: null as T, error: null, status: 204 };
    }
    const data = await res.json();
    return { data, error: null, status: res.status };
  } catch (e) {
    return { data: null, error: String(e) };
  }
}

// ========================================
// Polls
// ========================================

export type PollSortMode = "popular" | "recent" | "ending_soon" | "closed";

export const getPollFeed = async (
  sort: PollSortMode = "popular",
  search?: string,
  limit = 20,
  offset = 0
) => {
  const params = new URLSearchParams({ sort, limit: String(limit), offset: String(offset) });
  if (search) params.set("search", search);
  return apiFetch(`/api/v1/polls?${params}`);
};

export const getHotDebate = async () => {
  return apiFetch("/api/v1/polls/hot-debate");
};

export const getSuggestedPolls = async (limit = 10) => {
  return apiFetch(`/api/v1/polls/suggested?limit=${limit}`);
};

export const getPollById = async (pollId: string) => {
  return apiFetch(`/api/v1/polls/${pollId}`);
};

export const createPoll = async (body: Record<string, unknown>) => {
  return apiFetch("/api/v1/polls", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

export const updatePoll = async (pollId: string, body: Record<string, unknown>) => {
  return apiFetch(`/api/v1/polls/${pollId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
};

export const deletePoll = async (pollId: string) => {
  return apiFetch(`/api/v1/polls/${pollId}`, { method: "DELETE" });
};

export const castVote = async (pollId: string, body: Record<string, unknown>) => {
  return apiFetch(`/api/v1/polls/${pollId}/vote`, {
    method: "POST",
    body: JSON.stringify(body),
  });
};

export const getUserVote = async (pollId: string) => {
  return apiFetch(`/api/v1/polls/${pollId}/vote`);
};

export const createPollComment = async (pollId: string, body: Record<string, unknown>) => {
  return apiFetch(`/api/v1/polls/${pollId}/comments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
};

export const likePollComment = async (pollId: string, commentId: string) => {
  return apiFetch(`/api/v1/polls/${pollId}/comments/${commentId}/like`, {
    method: "POST",
  });
};

export const deletePollComment = async (pollId: string, commentId: string) => {
  return apiFetch(`/api/v1/polls/${pollId}/comments/${commentId}`, {
    method: "DELETE",
  });
};

export const incrementPollViewCount = async (pollId: string) => {
  return apiFetch(`/api/v1/polls/${pollId}/view`, { method: "POST" });
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
