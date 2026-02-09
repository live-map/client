import "server-only";

// Feeds
export { getFeedsApiV1FeedsGet as getFeedList } from "@/generated/openapi-client";
export { getFeedApiV1FeedsFeedIdGet as getFeed } from "@/generated/openapi-client";

// Agent
export { startInvestigationApiV1AgentInvestigatePost as startInvestigation } from "@/generated/openapi-client";
export { getInvestigationStatusApiV1AgentStatusInvestigationIdGet as getInvestigationStatus } from "@/generated/openapi-client";
export { triggerScanApiV1AgentScanPost as triggerScan } from "@/generated/openapi-client";
export { listInvestigationsApiV1AgentInvestigationsGet as listInvestigations } from "@/generated/openapi-client";

// Posts
export { listPostsApiV1PostsGet as getPostList } from "@/generated/openapi-client";
export { getPostApiV1PostsPostIdGet as getPost } from "@/generated/openapi-client";
export { createPostApiV1PostsPost as createPost } from "@/generated/openapi-client";
export { updatePostApiV1PostsPostIdPatch as updatePost } from "@/generated/openapi-client";
export { deletePostApiV1PostsPostIdDelete as deletePost } from "@/generated/openapi-client";
export { hardDeletePostApiV1PostsPostIdHardDelete as hardDeletePost } from "@/generated/openapi-client";
export { likePostApiV1PostsPostIdLikePost as likePost } from "@/generated/openapi-client";
export { unlikePostApiV1PostsPostIdLikeDelete as unlikePost } from "@/generated/openapi-client";
export { getPostLikersApiV1PostsPostIdLikesGet as getPostLikers } from "@/generated/openapi-client";
export { addMediaToPostApiV1PostsPostIdMediaPost as addMediaToPost } from "@/generated/openapi-client";
export { deleteMediaFromPostApiV1PostsPostIdMediaMediaIdDelete as deleteMediaFromPost } from "@/generated/openapi-client";

// Comments
export { listCommentsFlatApiV1CommentsGet as getCommentList } from "@/generated/openapi-client";
export { listCommentsTreeApiV1CommentsTreeGet as getCommentTree } from "@/generated/openapi-client";
export { getCommentApiV1CommentsCommentIdGet as getComment } from "@/generated/openapi-client";
export { createCommentApiV1CommentsPost as createComment } from "@/generated/openapi-client";
export { updateCommentApiV1CommentsCommentIdPatch as updateComment } from "@/generated/openapi-client";
export { deleteCommentApiV1CommentsCommentIdDelete as deleteComment } from "@/generated/openapi-client";
export { listRepliesApiV1CommentsCommentIdRepliesGet as getCommentReplies } from "@/generated/openapi-client";

// Media
export { getMediaConfigApiV1MediaConfigGet as getMediaConfig } from "@/generated/openapi-client";
export { generatePresignedUrlApiV1MediaPresignedUrlPost as generatePresignedUrl } from "@/generated/openapi-client";

// Health
export { healthCheckHealthGet as healthCheck } from "@/generated/openapi-client";
