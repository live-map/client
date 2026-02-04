"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { PollFeedSearch } from "@/components/polls/home/poll-feed-search";
import { PollFeedSort } from "@/components/polls/home/poll-feed-sort";
import { PollFeedCard } from "@/components/polls/home/poll-feed-card";
import { getPollFeed } from "@/app/actions/polls";
import type { PollCardData, PollSortMode } from "@/app/actions/polls/queries";

interface PollFeedProps {
  initialFeed: PollCardData[];
  onPollClick: (id: string) => void;
}

export function PollFeed({ initialFeed, onPollClick }: PollFeedProps) {
  const [sortMode, setSortMode] = useState<PollSortMode>("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [polls, setPolls] = useState(initialFeed);
  const [isPending, startTransition] = useTransition();

  const fetchFeed = useCallback((sort: PollSortMode, search: string) => {
    startTransition(async () => {
      const data = await getPollFeed(sort, search || undefined);
      setPolls(data);
    });
  }, []);

  useEffect(() => {
    // Skip fetching on initial mount with default values
    if (sortMode === "popular" && searchQuery === "") return;
    fetchFeed(sortMode, searchQuery);
  }, [sortMode, searchQuery, fetchFeed]);

  const handleSortChange = (sort: PollSortMode) => {
    setSortMode(sort);
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <section className="px-4 pb-4 pt-1">
      <PollFeedSearch onSearch={handleSearch} />

      <div className="mb-3 mt-2">
        <PollFeedSort activeSort={sortMode} onSortChange={handleSortChange} />
      </div>

      <div className="relative min-h-[120px]">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {polls.length > 0 ? (
          <div className="space-y-3">
            {polls.map((poll) => (
              <PollFeedCard key={poll.id} poll={poll} onClick={() => onPollClick(poll.id)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "검색 결과가 없습니다" : "여론조사가 없습니다"}
            </p>
          </div>
        )}
      </div>

      <Link
        href="/polls/suggest"
        className="mt-4 flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        유저 제안 보기
        <ChevronRight className="h-3 w-3" />
      </Link>
    </section>
  );
}
