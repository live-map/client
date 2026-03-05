"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, ThumbsUp, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";

import { likePost, unlikePost, deletePost } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils/format";
import { CommentSection } from "./comment-section";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PostResponse, CommentTreeResponse } from "@/generated/openapi-client/types.gen";

interface PostDetailClientProps {
  post: PostResponse;
  initialComments: CommentTreeResponse[];
}

export function PostDetailClient({ post, initialComments }: PostDetailClientProps) {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = authUser?.id === post.user_id;

  const handleDelete = async () => {
    setIsDeleting(true);
    const { error } = await deletePost(post.id);
    if (error) {
      toast.error("게시글 삭제에 실패했습니다.");
      setIsDeleting(false);
    } else {
      toast.success("게시글이 삭제되었습니다.");
      router.push("/community");
    }
  };

  const handleLikeToggle = async () => {
    const prevLiked = isLiked;
    const prevCount = likeCount;

    // Optimistic update
    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

    const { error } = prevLiked ? await unlikePost(post.id) : await likePost(post.id);

    if (error) {
      // Revert on error
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  return (
    <div className="px-4 py-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          뒤로가기
        </button>
        {isOwner && (
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                disabled={isDeleting}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "삭제 중..." : "삭제"}</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>게시글 삭제</DialogTitle>
                <DialogDescription>
                  게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
                  >
                    취소
                  </button>
                </DialogClose>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  삭제
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Post title */}
      <h1 className="text-lg font-bold text-foreground mb-2">{post.title}</h1>

      {/* Post meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
        <span>{post.user_name ?? "익명"}</span>
        <span>{formatRelativeTime(post.created_at)}</span>
        <div className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          <span>{post.view_count ?? 0}</span>
        </div>
      </div>

      {/* Post content */}
      <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mb-4">
        {post.content}
      </div>

      {/* Post media */}
      {post.media && post.media.length > 0 && (
        <div className="space-y-2 mb-4">
          {post.media.map((media) => (
            <div key={media.id} className="relative w-full rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={media.url} alt="" className="w-full h-auto object-cover rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-4 py-3 border-t border-b border-border mb-4">
        <button
          type="button"
          onClick={handleLikeToggle}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            isLiked ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          <span>추천 {likeCount}</span>
        </button>
      </div>

      {/* Comment section */}
      <CommentSection postId={post.id} initialComments={initialComments} />
    </div>
  );
}
