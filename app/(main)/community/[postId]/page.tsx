import { getPost, getCommentTree } from "@/lib/api";
import { PostDetailClient } from "@/components/community/post-detail-client";

interface PostDetailPageProps {
  params: Promise<{ postId: string }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  const [postResult, commentsResult] = await Promise.all([getPost(postId), getCommentTree(postId)]);

  if (!postResult.data) {
    return (
      <div className="px-4 py-12 text-center text-sm text-muted-foreground">
        게시글을 찾을 수 없습니다
      </div>
    );
  }

  return (
    <PostDetailClient post={postResult.data} initialComments={commentsResult.data?.items ?? []} />
  );
}
