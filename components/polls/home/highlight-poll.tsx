"use client";

import { ChevronRight, Users, Vote } from "lucide-react";
import type { PollCardData } from "@/app/actions/polls/queries";

interface HighlightPollProps {
  poll: PollCardData;
  onClick: () => void;
}

export function HighlightPoll({ poll, onClick }: HighlightPollProps) {
  const categoryLabel = poll.type === "OFFICIAL" ? "정치" : "제안";

  return (
    <section className="px-4 py-3">
      <div className="mb-3 flex items-center gap-2">
        <Vote className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">실시간 투표 참여하기</h2>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-xl border border-border bg-card p-3 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          {/* Left: Placeholder Image */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Vote className="h-8 w-8" />
            </div>
          </div>

          {/* Right: Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {categoryLabel}
                </span>
                <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground line-clamp-2">
                  {poll.title}
                </h3>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>

            {/* Stats */}
            <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="text-[11px]">{poll.totalVotes.toLocaleString()}명 참여</span>
            </div>
          </div>
        </div>
      </button>
    </section>
  );
}
