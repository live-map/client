"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Share2,
  Flag,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock suggestion data
const mockSuggestion = {
  id: "suggestion-1",
  title: "국가위기관리단 신설, 어떻게 생각하시나요?",
  category: "정치",
  description: `최근 여러 재난 상황에서 정부의 대응이 늦다는 비판이 있습니다.

이에 대통령 직속 국가위기관리단 신설이 논의되고 있는데요, 여러분의 의견이 궁금합니다.

주요 논점:
- 기존 재난안전관리본부와의 역할 중복 문제
- 예산 및 인력 확보 방안
- 실질적인 권한 범위`,
  author: "익명의사용자",
  authorId: "user123",
  likes: 1523,
  isLiked: false,
  createdAt: "2025-02-03T10:30:00",
  status: "검토중", // 검토중, 등록예정, 등록완료, 반려
  comments: [
    {
      id: "c1",
      author: "정치관심러",
      isAnonymous: false,
      content: "이거 진짜 필요한 제안입니다. 빨리 여론조사로 만들어주세요!",
      likes: 234,
      createdAt: "1시간 전",
      isLiked: false,
    },
    {
      id: "c2",
      author: "익명",
      isAnonymous: true,
      content: "유사한 기관이 있는데 굳이 신설이 필요할까요?",
      likes: 45,
      createdAt: "3시간 전",
      isLiked: false,
    },
    {
      id: "c3",
      author: "익명",
      isAnonymous: true,
      content: "현직 공무원입니다. 조직 신설보다 권한 강화가 더 시급해요.",
      likes: 78,
      createdAt: "5시간 전",
      isLiked: false,
    },
  ],
};

const statusColors: Record<string, { bg: string; text: string }> = {
  검토중: { bg: "bg-amber-100", text: "text-amber-700" },
  등록예정: { bg: "bg-blue-100", text: "text-blue-700" },
  등록완료: { bg: "bg-green-100", text: "text-green-700" },
  반려: { bg: "bg-red-100", text: "text-red-700" },
};

export default function SuggestionDetailPage() {
  useParams();
  const [suggestion, setSuggestion] = useState(mockSuggestion);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(mockSuggestion.comments);
  const [isAnonymous, setIsAnonymous] = useState(true); // 기본 익명

  const handleLike = () => {
    setSuggestion((prev) => ({
      ...prev,
      isLiked: !prev.isLiked,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
    }));
  };

  const handleCommentLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;

    const newComment = {
      id: `c${Date.now()}`,
      author: isAnonymous ? "익명" : "나",
      isAnonymous,
      content: commentText,
      likes: 0,
      createdAt: "방금 전",
      isLiked: false,
    };

    setComments((prev) => [newComment, ...prev]);
    setCommentText("");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const status = statusColors[suggestion.status];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-lg mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/polls/suggest"
              className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <span className="text-[13px] font-medium text-foreground">제안 상세</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">
        {/* Suggestion Content */}
        <div className="px-4 py-4">
          {/* Status & Category */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}
            >
              {suggestion.status}
            </span>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {suggestion.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-lg font-bold text-foreground leading-tight mb-3">
            {suggestion.title}
          </h1>

          {/* Author & Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <span>{suggestion.author}</span>
            <span>·</span>
            <span>{formatDate(suggestion.createdAt)}</span>
          </div>

          {/* Description */}
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
              {suggestion.description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                suggestion.isLiked
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              추천 {suggestion.likes.toLocaleString()}
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              댓글 {comments.length}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="border-t border-border mt-2">
          <div className="px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">댓글 {comments.length}개</h2>
          </div>

          {/* Comment List */}
          <div className="divide-y divide-border">
            {comments.map((comment) => (
              <div key={comment.id} className="px-4 py-3">
                <div className="flex gap-2.5">
                  {/* 프로필 아바타 */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      comment.isAnonymous
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {comment.isAnonymous ? "?" : comment.author[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{comment.author}</span>
                      {comment.isAnonymous && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          익명
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">{comment.createdAt}</span>
                    </div>
                    <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => handleCommentLike(comment.id)}
                        className={`flex items-center gap-1 transition-colors ${
                          comment.isLiked ? "text-primary" : "hover:text-primary"
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{comment.likes}</span>
                      </button>
                      <button type="button" className="hover:text-primary transition-colors">
                        답글
                      </button>
                      <button type="button" className="hover:text-primary transition-colors">
                        <Flag className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-lg mx-auto px-4 py-2.5">
          {/* 익명 체크박스 */}
          <label className="flex items-center gap-1.5 mb-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
            />
            <span className="text-[11px] text-muted-foreground">익명으로 작성</span>
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={isAnonymous ? "익명으로 의견을 남겨보세요..." : "의견을 남겨보세요..."}
              className="flex-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <Button
              size="sm"
              disabled={!commentText.trim()}
              onClick={handleSubmitComment}
              className="px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
