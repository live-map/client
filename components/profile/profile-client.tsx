"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ArrowLeft,
  Settings,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  User,
  FileText,
  Trash2,
  Eye,
  Heart,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePost, deleteComment, getPostList, getCommentList } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils/format";
import type { PostResponse, CommentResponse } from "@/generated/openapi-client/types.gen";

interface ProfileUser {
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string; // ISO string
}

interface ProfileClientProps {
  user: ProfileUser;
  userId: string;
  postCount: number;
  commentCount: number;
  initialPosts: PostResponse[];
  initialComments: CommentResponse[];
}

export default function ProfileClient({
  user,
  userId,
  postCount,
  commentCount,
  initialPosts,
  initialComments,
}: ProfileClientProps) {
  const { logout } = useAuth();
  const joinDate = new Date(user.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [expandedSection, setExpandedSection] = useState<"posts" | "comments" | null>(null);
  const [posts, setPosts] = useState<PostResponse[]>(initialPosts);
  const [comments, setComments] = useState<CommentResponse[]>(initialComments);
  const [postsTotal, setPostsTotal] = useState(postCount);
  const [commentsTotal, setCommentsTotal] = useState(commentCount);
  const [isPending, startTransition] = useTransition();

  const loadMorePosts = () => {
    startTransition(async () => {
      const result = await getPostList(10, posts.length, undefined, userId);
      if (result.data?.items) {
        setPosts((prev) => [...prev, ...result.data!.items]);
      }
    });
  };

  const loadMoreComments = () => {
    startTransition(async () => {
      const result = await getCommentList(undefined, userId, 10, comments.length);
      if (result.data?.items) {
        setComments((prev) => [...prev, ...result.data!.items]);
      }
    });
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    const { error } = await deletePost(postId);
    if (error) {
      alert("삭제에 실패했습니다.");
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setPostsTotal((prev) => prev - 1);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    const { error } = await deleteComment(commentId);
    if (error) {
      alert("삭제에 실패했습니다.");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsTotal((prev) => prev - 1);
  };

  const menuItems = [
    { icon: Bell, label: "알림 설정", href: "/profile/notifications" },
    { icon: Shield, label: "개인정보 관리", href: "/profile/privacy" },
    { icon: HelpCircle, label: "고객센터", href: "/polls/about" },
  ];

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="font-bold text-foreground">마이페이지</h1>
          </div>
          <Link
            href="/profile/settings"
            className="p-1.5 hover:bg-foreground/5 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>
      </header>

      <div className="pb-20">
        {/* Profile Card */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "프로필"}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{user.name ?? "사용자"}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">가입일: {joinDate}</p>
            </div>
          </div>
        </div>

        {/* Stats — clickable */}
        <div className="px-4 pb-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setExpandedSection(expandedSection === "posts" ? null : "posts")}
              className="bg-card border border-border rounded-xl p-3 text-center transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <ChevronDown
                  className={`w-3 h-3 text-muted-foreground transition-transform ${expandedSection === "posts" ? "rotate-180" : ""}`}
                />
              </div>
              <p className="text-lg font-bold text-foreground">{postsTotal}</p>
              <p className="text-[10px] text-muted-foreground">게시글</p>
            </button>
            <button
              onClick={() => setExpandedSection(expandedSection === "comments" ? null : "comments")}
              className="bg-card border border-border rounded-xl p-3 text-center transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                <ChevronDown
                  className={`w-3 h-3 text-muted-foreground transition-transform ${expandedSection === "comments" ? "rotate-180" : ""}`}
                />
              </div>
              <p className="text-lg font-bold text-foreground">{commentsTotal}</p>
              <p className="text-[10px] text-muted-foreground">댓글</p>
            </button>
          </div>
        </div>

        {/* Expanded Section: Posts */}
        {expandedSection === "posts" && (
          <div className="px-4 pb-4">
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  작성한 게시글이 없습니다
                </p>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="flex items-start gap-3 p-3">
                    <Link href={`/community/${post.id}`} className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Heart className="w-3 h-3" />
                          {post.like_count ?? 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" />
                          {post.comment_count ?? 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          {post.view_count ?? 0}
                        </span>
                        <span>{formatRelativeTime(post.created_at)}</span>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {posts.length < postsTotal && (
              <button
                onClick={loadMorePosts}
                disabled={isPending}
                className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                더보기
              </button>
            )}
          </div>
        )}

        {/* Expanded Section: Comments */}
        {expandedSection === "comments" && (
          <div className="px-4 pb-4">
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  작성한 댓글이 없습니다
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3 p-3">
                    <Link href={`/community/${comment.post_id}`} className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(comment.created_at)}
                      </p>
                    </Link>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {comments.length < commentsTotal && (
              <button
                onClick={loadMoreComments}
                disabled={isPending}
                className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                더보기
              </button>
            )}
          </div>
        )}

        {/* Menu */}
        <div className="border-t border-border">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <div className="px-4 mt-6">
          <Button
            variant="outline"
            className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 bg-transparent"
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </div>
    </>
  );
}
