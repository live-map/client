"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MessageSquare,
  ThumbsUp,
  Eye,
  TrendingUp,
  Clock,
  Flame,
  BarChart3,
  Heart,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { getPostList } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils/format";
import type { PostResponse, SortType } from "@/generated/openapi-client/types.gen";

interface CommunitySectionProps {
  initialPosts: PostResponse[];
  initialTotal: number;
}

// Primary sort tabs (always visible)
const primarySortTabs: { key: SortType; label: string; icon: typeof TrendingUp }[] = [
  { key: "popular", label: "인기", icon: TrendingUp },
  { key: "newest", label: "최신", icon: Clock },
  { key: "most_viewed", label: "조회", icon: BarChart3 },
  { key: "most_liked", label: "추천", icon: Heart },
];

// Time-windowed hot sorts
const timeWindowTabs: { key: SortType; label: string; icon: typeof Calendar }[] = [
  { key: "daily_hot", label: "일간", icon: Flame },
  { key: "weekly_hot", label: "주간", icon: Flame },
  { key: "monthly_hot", label: "월간", icon: Calendar },
];

const POSTS_PER_PAGE = 20;

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);

  return pages;
}

export function CommunitySection({ initialPosts, initialTotal }: CommunitySectionProps) {
  const [sortType, setSortType] = useState<SortType>("popular");
  const [posts, setPosts] = useState<PostResponse[]>(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));

  const isTimeWindow = (["daily_hot", "weekly_hot", "monthly_hot"] as SortType[]).includes(
    sortType
  );

  const fetchPosts = async (sort: SortType, page: number) => {
    setLoading(true);
    const offset = (page - 1) * POSTS_PER_PAGE;
    const { data } = await getPostList(POSTS_PER_PAGE, offset, sort);
    setPosts(data?.items ?? []);
    setTotal(data?.total ?? 0);
    setLoading(false);
  };

  const handleSortChange = async (newSort: SortType) => {
    setSortType(newSort);
    setCurrentPage(1);
    await fetchPosts(newSort, 1);
  };

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    await fetchPosts(sortType, page);
  };

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">커뮤니티</h2>
      </div>

      {/* Sort Tabs */}
      <div className="space-y-2 mb-3">
        {/* Sort Tabs: Simple (left) + Time-Windowed (right) */}
        <div className="flex items-center">
          {/* Simple Sorts */}
          <div className="flex gap-1.5">
            {primarySortTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleSortChange(tab.key)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                    sortType === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="ml-auto" />

          {/* Time-Windowed Sorts */}
          <div className="flex gap-1.5">
            {timeWindowTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleSortChange(tab.key)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                    sortType === tab.key
                      ? "bg-orange-500 text-white"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Sort Indicator */}
      {isTimeWindow && (
        <div className="mb-2 px-1">
          <span className="text-[11px] text-orange-500 font-medium">
            {sortType === "daily_hot" && "최근 24시간 인기 게시글"}
            {sortType === "weekly_hot" && "최근 7일 인기 게시글"}
            {sortType === "monthly_hot" && "최근 30일 인기 게시글"}
          </span>
        </div>
      )}

      {/* Post List */}
      <div className={`space-y-2 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}>
        {posts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">게시글이 없습니다</div>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="block w-full bg-card border border-border rounded-xl p-3 hover:shadow-sm hover:border-border/80 transition-all duration-200 text-left group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1 font-medium">{post.title}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span>{post.user_name ?? "익명"}</span>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{post.like_count ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{post.comment_count ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{post.view_count ?? 0}</span>
                    </div>
                    <span>{formatRelativeTime(post.created_at)}</span>
                  </div>
                </div>
                {post.media && post.media.length > 0 && (
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.media[0].thumbnail_url ?? post.media[0].url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {getPageNumbers(currentPage, totalPages).map((page, i) =>
            page === "..." ? (
              <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page as number)}
                disabled={loading}
                className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {page}
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Write Button */}
      <Link
        href="/community/new"
        className="flex items-center justify-center gap-1 w-full mt-4 py-2.5 bg-muted/50 hover:bg-muted text-sm text-muted-foreground hover:text-foreground rounded-xl transition-all"
      >
        <MessageSquare className="w-4 h-4" />
        글쓰기
      </Link>
    </div>
  );
}
