"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MessageSquare,
  ThumbsUp,
  Eye,
  TrendingUp,
  Clock,
  ChevronRight,
  Flame,
  BarChart3,
  Heart,
  Calendar,
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

export function CommunitySection({ initialPosts, initialTotal }: CommunitySectionProps) {
  const [sortType, setSortType] = useState<SortType>("popular");
  const [posts, setPosts] = useState<PostResponse[]>(initialPosts);
  const [, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);

  const isTimeWindow = (["daily_hot", "weekly_hot", "monthly_hot"] as SortType[]).includes(
    sortType
  );

  const handleSortChange = async (newSort: SortType) => {
    setSortType(newSort);
    setLoading(true);
    const { data } = await getPostList(20, 0, newSort);
    setPosts(data?.items ?? []);
    setTotal(data?.total ?? 0);
    setLoading(false);
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
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-2 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Write Button */}
      <button
        type="button"
        onClick={() => alert("커뮤니티 글쓰기 기능은 준비중입니다.")}
        className="flex items-center justify-center gap-1 w-full mt-4 py-2.5 bg-muted/50 hover:bg-muted text-sm text-muted-foreground hover:text-foreground rounded-xl transition-all"
      >
        <MessageSquare className="w-4 h-4" />
        글쓰기
      </button>
    </div>
  );
}
