"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";

import { createComment, getCommentTree } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils/format";
import type { CommentTreeResponse } from "@/generated/openapi-client/types.gen";

interface CommentSectionProps {
  postId: string;
  initialComments: CommentTreeResponse[];
}

function countComments(comments: CommentTreeResponse[]): number {
  let count = 0;
  for (const c of comments) {
    count += 1;
    if (c.replies) {
      count += countComments(c.replies);
    }
  }
  return count;
}

interface CommentItemProps {
  comment: CommentTreeResponse;
  postId: string;
  depth: number;
  onCommentCreated: () => void;
}

function CommentItem({ comment, postId, depth, onCommentCreated }: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim() || submitting) return;
    setSubmitting(true);
    const { error } = await createComment({
      post_id: postId,
      content: replyContent.trim(),
      parent_id: comment.id,
    });
    setSubmitting(false);
    if (!error) {
      setReplyContent("");
      setShowReplyInput(false);
      onCommentCreated();
    }
  };

  const maxIndent = 3;
  const indentClass = depth > 0 && depth <= maxIndent ? "pl-4 border-l border-border" : "";

  return (
    <div className={indentClass}>
      <div className="py-2.5">
        {comment.is_deleted ? (
          <p className="text-sm text-muted-foreground italic">삭제된 댓글입니다</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-foreground">
                {comment.user_name ?? "익명"}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {formatRelativeTime(comment.created_at)}
              </span>
            </div>
            <p className="text-sm text-foreground">{comment.content}</p>
            {depth < maxIndent && (
              <button
                type="button"
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                답글
              </button>
            )}
          </>
        )}

        {/* Reply input */}
        {showReplyInput && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 입력하세요"
              className="flex-1 px-3 py-1.5 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  handleReply();
                }
              }}
            />
            <button
              type="button"
              onClick={handleReply}
              disabled={submitting || !replyContent.trim()}
              className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
            >
              {submitting ? "..." : "등록"}
            </button>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              onCommentCreated={onCommentCreated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentTreeResponse[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalCount = countComments(comments);

  const refetchComments = async () => {
    const { data } = await getCommentTree(postId);
    if (data?.items) {
      setComments(data.items);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    const { error } = await createComment({
      post_id: postId,
      content: newComment.trim(),
    });
    setSubmitting(false);
    if (!error) {
      setNewComment("");
      await refetchComments();
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">댓글 {totalCount}</span>
      </div>

      {/* Comment input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요"
          className="flex-1 px-3 py-2 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              handleSubmit();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !newComment.trim()}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
        >
          {submitting ? "..." : "등록"}
        </button>
      </div>

      {/* Comment tree */}
      {comments.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          첫 번째 댓글을 작성해보세요
        </div>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              depth={0}
              onCommentCreated={refetchComments}
            />
          ))}
        </div>
      )}
    </div>
  );
}
