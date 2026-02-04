"use client";

import type { PollSortMode } from "@/app/actions/polls/queries";

const SORT_OPTIONS: { value: PollSortMode; label: string }[] = [
  { value: "popular", label: "인기순" },
  { value: "recent", label: "최신순" },
  { value: "ending_soon", label: "마감임박" },
  { value: "closed", label: "종료됨" },
];

interface PollFeedSortProps {
  activeSort: PollSortMode;
  onSortChange: (sort: PollSortMode) => void;
}

export function PollFeedSort({ activeSort, onSortChange }: PollFeedSortProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSortChange(option.value)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            activeSort === option.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
