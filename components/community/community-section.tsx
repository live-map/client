"use client";

import Link from "next/link";

import { useState } from "react";
import { MessageSquare, ThumbsUp, Eye, TrendingUp, Clock, ChevronRight, Flame } from "lucide-react";

type SortType = "hot" | "latest";

interface Post {
  id: string;
  title: string;
  category: string;
  author: string;
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
  isHot?: boolean;
}

interface CommunitySectionProps {
  posts: Post[];
}

const categoryFilters = ["전체", "자유", "정치토론", "경제토론", "사회이슈", "유머"];

export function CommunitySection({ posts }: CommunitySectionProps) {
  const [sortType, setSortType] = useState<SortType>("hot");
  const [categoryFilter, setCategoryFilter] = useState("전체");

  const sortTabs: { key: SortType; label: string; icon: typeof TrendingUp }[] = [
    { key: "hot", label: "인기", icon: TrendingUp },
    { key: "latest", label: "최신", icon: Clock },
  ];

  const filteredPosts = posts.filter(
    (post) => categoryFilter === "전체" || post.category === categoryFilter
  );

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-foreground">커뮤니티</h2>
        <span className="text-xs text-muted-foreground">준비중</span>
      </div>

      {/* Sort & Filter */}
      <div className="space-y-2 mb-3">
        {/* Sort Tabs */}
        <div className="flex gap-1">
          {sortTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSortType(tab.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  sortType === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {categoryFilters.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                categoryFilter === category
                  ? "bg-foreground/10 text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Post List */}
      <div className="space-y-2">
        {filteredPosts.map((post) => (
          <Link
            key={post.id}
            href="#"
            className="block w-full bg-card border border-border rounded-xl p-3 hover:shadow-sm hover:border-border/80 transition-all duration-200 text-left group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  {post.isHot && (
                    <span className="flex items-center gap-0.5 text-[10px] text-orange-500 font-medium">
                      <Flame className="w-3 h-3" />
                      HOT
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {post.category}
                  </span>
                </div>
                <p className="text-sm text-foreground line-clamp-1 font-medium">{post.title}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <span>{post.author}</span>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{post.comments}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{post.views}</span>
                  </div>
                  <span>{post.createdAt}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-2 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
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
