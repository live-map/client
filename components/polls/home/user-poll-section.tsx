"use client";

import { useState } from "react";
import { Plus, ThumbsUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type SortType = "popular" | "latest";

interface UserPoll {
  id: string;
  title: string;
  category: string;
  author: string;
  likes: number;
  createdAt: string;
}

const categoryFilters = ["전체", "정치", "경제", "사회", "IT/기술", "문화", "스포츠"];

interface UserPollSectionProps {
  polls: UserPoll[];
  onCreateClick: () => void;
  onPollClick: (id: string) => void;
}

export function UserPollSection({ polls, onCreateClick }: UserPollSectionProps) {
  const [sortType, setSortType] = useState<SortType>("popular");
  const [categoryFilter, setCategoryFilter] = useState("전체");

  const sortTabs: { key: SortType; label: string }[] = [
    { key: "popular", label: "추천순" },
    { key: "latest", label: "최신순" },
  ];

  const filteredPolls = polls.filter(
    (poll) => categoryFilter === "전체" || poll.category === categoryFilter
  );

  return (
    <section className="px-4 py-5 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-foreground text-sm">여론조사 제안하기</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            추천을 많이 받으면 공식 여론조사로 등록돼요
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1 h-8 text-xs bg-transparent"
          onClick={onCreateClick}
        >
          <Plus className="w-3.5 h-3.5" />
          제안하기
        </Button>
      </div>

      {/* Sort & Filter */}
      <div className="space-y-2 mb-3">
        {/* Sort Tabs */}
        <div className="flex gap-1">
          {sortTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSortType(tab.key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                sortType === tab.key
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
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

      {/* Poll List */}
      <div className="space-y-2">
        {filteredPolls.map((poll, index) => (
          <Link
            key={poll.id}
            href={`/polls/suggest/${poll.id}`}
            className="block w-full bg-card border border-border rounded-xl p-3 hover:shadow-sm hover:border-border/80 transition-all duration-200 text-left"
          >
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground font-medium text-xs min-w-[16px]">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-1">{poll.title}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                  <span>{poll.author}</span>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    <span>{poll.likes.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* More Button */}
      <Link
        href="/polls/suggest"
        className="flex items-center justify-center gap-1 w-full mt-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
      >
        더보기
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </section>
  );
}
