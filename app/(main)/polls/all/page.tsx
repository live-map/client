"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Search, Users, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getPollFeed } from "@/app/actions/polls/queries";
import type { PollCardData, PollSortMode } from "@/app/actions/polls/queries";

const INTERACTION_TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: "단일선택",
  BINARY: "양자택일",
  EMOJI_REACTION: "이모지",
  SLIDER: "스펙트럼",
  MULTIPLE_CHOICE: "복수선택",
  RANKING: "순위",
};

const categoryFilters = ["전체", "정치", "경제", "사회", "IT/기술", "문화", "스포츠"];
const PAGE_SIZE = 20;

export default function PollsAllPage() {
  const [sortType, setSortType] = useState<PollSortMode>("popular");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [polls, setPolls] = useState<PollCardData[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data from API
  const fetchPolls = useCallback(
    async (reset: boolean) => {
      const currentOffset = reset ? 0 : offset;
      const data = await getPollFeed(
        sortType,
        debouncedSearch || undefined,
        PAGE_SIZE,
        currentOffset
      );
      if (reset) {
        setPolls(data);
      } else {
        setPolls((prev) => [...prev, ...data]);
      }
      setHasMore(data.length >= PAGE_SIZE);
      setOffset(currentOffset + data.length);
      setLoading(false);
    },
    [sortType, debouncedSearch, offset]
  );

  // Refetch on filter changes
  const prevFilterRef = useRef(`${sortType}-${debouncedSearch}`);
  useEffect(() => {
    const key = `${sortType}-${debouncedSearch}`;
    if (prevFilterRef.current !== key) {
      prevFilterRef.current = key;
    }
    fetchPolls(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortType, debouncedSearch]);

  // Load more
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    fetchPolls(false);
  }, [loading, hasMore, fetchPolls]);

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

  const sortOptions: { value: PollSortMode; label: string }[] = [
    { value: "popular", label: "인기순" },
    { value: "recent", label: "최신순" },
    { value: "ending_soon", label: "마감임박" },
  ];

  const filteredPolls =
    categoryFilter === "전체" ? polls : polls.filter((poll) => poll.category === categoryFilter);

  const formatEndDate = (endsAt: Date | string | null) => {
    if (!endsAt) return null;
    const d = new Date(endsAt);
    return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/polls"
            className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="font-bold text-foreground">전체 여론조사</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="여론조사 검색..."
            aria-label="여론조사 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Sort & Filter */}
        <div className="space-y-2 mb-4">
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
            <Link
              key={poll.id}
              href={`/polls/${poll.id}`}
              className="block w-full bg-card border border-border rounded-xl p-3 hover:shadow-md transition-all duration-200 hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                {poll.imageUrl && (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <Image src={poll.imageUrl} alt={poll.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {poll.category && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {poll.category}
                      </span>
                    )}
                    {INTERACTION_TYPE_LABELS[poll.interactionType] && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {INTERACTION_TYPE_LABELS[poll.interactionType]}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-foreground text-sm mt-1 line-clamp-2 leading-snug">
                    {poll.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className="text-[11px]">{poll.totalVotes.toLocaleString()}명</span>
                    </div>
                    {poll.endsAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-[11px]">~{formatEndDate(poll.endsAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {!loading && filteredPolls.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">여론조사가 없습니다</p>
          </div>
        )}

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {loading && (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
          {!hasMore && polls.length > 0 && (
            <p className="text-sm text-muted-foreground">모든 여론조사를 불러왔습니다</p>
          )}
        </div>
      </main>
    </div>
  );
}
