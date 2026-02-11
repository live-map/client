"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search, Users, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSuggestedPolls } from "@/app/actions/polls/queries";
import type { PollCardData } from "@/app/actions/polls/queries";

type SortType = "popular" | "recent";

const categoryFilters = ["전체", "정치", "경제", "사회", "IT/기술", "문화", "스포츠"];

export default function SuggestionsPage() {
  const [sortType, setSortType] = useState<SortType>("popular");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [polls, setPolls] = useState<PollCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSuggestedPolls(50)
      .then((data) => {
        setPolls(data);
        setLoading(false);
      })
      .catch(() => {
        setPolls([]);
        setLoading(false);
      });
  }, []);

  const sortOptions: { value: SortType; label: string }[] = [
    { value: "popular", label: "추천순" },
    { value: "recent", label: "최신순" },
  ];

  const filtered = polls
    .filter((p) => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((p) => categoryFilter === "전체" || p.category === categoryFilter)
    .sort((a, b) => {
      if (sortType === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return b.totalVotes - a.totalVotes;
    });

  const formatEndDate = (endsAt: Date | string | null) => {
    if (!endsAt) return null;
    const d = new Date(endsAt);
    return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/polls"
              className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="font-bold text-foreground">여론조사 제안</h1>
          </div>
          <Button size="sm" className="gap-1 h-8 text-xs" asChild>
            <Link href="/polls/suggest/new">
              <Plus className="w-3.5 h-3.5" />
              제안하기
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="제안 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Sort & Filter */}
        <div className="space-y-2 mb-4">
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

        {/* Info Banner */}
        <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground">
            추천을 많이 받은 제안은 공식 여론조사로 등록됩니다
          </p>
        </div>

        {/* Poll List */}
        <div className="space-y-2">
          {filtered.map((poll, index) => (
            <Link
              key={poll.id}
              href={`/polls/${poll.id}`}
              className="block w-full bg-card border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground font-medium text-xs min-w-[20px]">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2">{poll.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    {poll.user?.name && <span>{poll.user.name}</span>}
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{poll.totalVotes.toLocaleString()}</span>
                    </div>
                    {poll.endsAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>~{formatEndDate(poll.endsAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Loading / Empty */}
        <div className="py-8 flex justify-center">
          {loading && (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">제안된 여론조사가 없습니다</p>
          )}
        </div>
      </main>
    </div>
  );
}
