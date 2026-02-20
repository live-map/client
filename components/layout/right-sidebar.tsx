"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Tag, BarChart3 } from "lucide-react";
import { getPollFeed } from "@/app/actions/polls/queries";
import type { PollCardData } from "@/app/actions/polls/queries";

const categories = ["정치", "경제", "사회", "IT/기술", "문화", "스포츠"];

export function RightSidebar() {
  const [popularPolls, setPopularPolls] = useState<PollCardData[]>([]);

  useEffect(() => {
    getPollFeed("popular", undefined, 5, 0)
      .then(setPopularPolls)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      {/* Popular Polls */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">인기 여론조사</h3>
        </div>
        <div className="space-y-2.5">
          {popularPolls.map((poll, i) => (
            <Link
              key={poll.id}
              href={`/polls/${poll.id}`}
              className="flex items-start gap-2.5 group"
            >
              <span className="text-xs font-bold text-muted-foreground min-w-[16px] mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                  {poll.title}
                </p>
                <span className="text-[11px] text-muted-foreground">
                  {poll.totalVotes.toLocaleString()}명 참여
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">카테고리</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/polls/all?category=${encodeURIComponent(cat)}`}
              className="px-3 py-1.5 rounded-full text-xs bg-muted/80 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Platform Stats */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">플랫폼 통계</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {popularPolls.length > 0 ? "50+" : "-"}
            </p>
            <p className="text-[11px] text-muted-foreground">총 여론조사</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {popularPolls.reduce((sum, p) => sum + p.totalVotes, 0).toLocaleString() || "-"}
            </p>
            <p className="text-[11px] text-muted-foreground">총 투표 수</p>
          </div>
        </div>
      </div>
    </div>
  );
}
