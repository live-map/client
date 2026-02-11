"use client";

import { useState } from "react";
import { Search, ChevronRight, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type SortType = "popular" | "latest" | "ending";

interface Poll {
  id: string;
  title: string;
  category: string;
  image?: string;
  totalVotes: number;
  endDate?: string;
  createdAt?: string;
}

interface PollListProps {
  polls: Poll[];
  onPollClick: (id: string) => void;
}

const categoryFilters = ["전체", "정치", "경제", "사회", "IT/기술", "문화", "스포츠"];

export function PollList({ polls, onPollClick }: PollListProps) {
  const [sortType, setSortType] = useState<SortType>("popular");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const sortOptions: { value: SortType; label: string }[] = [
    { value: "popular", label: "인기순" },
    { value: "latest", label: "최신순" },
    { value: "ending", label: "마감임박" },
  ];

  const filteredPolls = polls
    .filter((poll) => poll.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((poll) => categoryFilter === "전체" || poll.category === categoryFilter);

  return (
    <section className="px-4 py-3">
      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="여론조사 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>

      {/* Sort & Filter */}
      <div className="space-y-2 mb-3">
        {/* Sort Tabs */}
        <div className="flex gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSortType(option.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                sortType === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {option.label}
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
        {filteredPolls.map((poll) => (
          <button
            key={poll.id}
            type="button"
            onClick={() => onPollClick(poll.id)}
            className="w-full bg-card border border-border rounded-2xl p-3 hover:shadow-md transition-all duration-200 hover:border-border/80 hover:-translate-y-0.5 text-left group"
          >
            <div className="flex items-center gap-3">
              {/* Left: Representative Image */}
              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                <Image
                  src={poll.image || "/placeholder.svg"}
                  alt={poll.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Right: Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {poll.category}
                    </span>
                    <h3 className="font-medium text-foreground text-sm mt-1 line-clamp-2 leading-snug">
                      {poll.title}
                    </h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 mt-1.5 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span className="text-[11px]">{poll.totalVotes.toLocaleString()}명</span>
                  </div>
                  {poll.endDate && <span className="text-[11px]">~{poll.endDate}</span>}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* More Button */}
      <Link
        href="/polls/all"
        className="block w-full mt-3 py-2 text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        더보기
      </Link>
    </section>
  );
}
