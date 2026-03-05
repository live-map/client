"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
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

const PAGE_SIZE = 20;

export function CommunitySection({ initialPosts, initialTotal }: CommunitySectionProps) {
  const [sortType, setSortType] = useState<SortType>("popular");
  const [posts, setPosts] = useState<PostResponse[]>(initialPosts);
  const [, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const isTimeWindow = (["daily_hot", "weekly_hot", "monthly_hot"] as SortType[]).includes(
    sortType
  );

  const fetchPosts = useCallback(
    async (sort: SortType, reset: boolean) => {
      setLoading(true);
      const currentOffset = reset ? 0 : posts.length;
      const { data } = await getPostList(PAGE_SIZE, currentOffset, sort);
      const newItems = data?.items ?? [];
      const newTotal = data?.total ?? 0;

      if (reset) {
        setPosts(newItems);
      } else {
        setPosts((prev) => [...prev, ...newItems]);
      }
      setTotal(newTotal);
      setHasMore(reset ? newItems.length < newTotal : currentOffset + newItems.length < newTotal);
      setLoading(false);
    },
    [posts.length]
  );

  const handleSortChange = async (newSort: SortType) => {
    if (newSort === sortType) return;
    setSortType(newSort);
    setHasMore(true);
    await fetchPosts(newSort, true);
  };

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    fetchPosts(sortType, false);
  }, [loading, hasMore, fetchPosts, sortType]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <div className="px-4 py-4 lg:px-0">
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
      <div className="space-y-2">
        {posts.length === 0 && !loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">게시글이 없습니다</div>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="block w-full bg-card border border-border rounded-xl p-3 lg:p-4 hover:shadow-sm hover:border-border/80 transition-all duration-200 text-left group"
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

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="py-6 flex justify-center">
        {loading && (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-xs text-muted-foreground">모든 게시글을 불러왔습니다</p>
        )}
      </div>

      {/* Write Button */}
      <Link
        href="/community/new"
        className="flex items-center justify-center gap-1 w-full mt-2 py-2.5 bg-muted/50 hover:bg-muted text-sm text-muted-foreground hover:text-foreground rounded-xl transition-all"
      >
        <MessageSquare className="w-4 h-4" />
        글쓰기
      </Link>
    </div>
  );
}
