"use client";

import { TrendingUp, Flag } from "lucide-react";
import { TrendingTicker } from "@/components/polls/home/trending-ticker";
import type { PollCardData } from "@/app/actions/polls/queries";

interface HomeHeroProps {
  trending: PollCardData[];
  onPollClick: (id: string) => void;
}

export function HomeHero({ trending, onPollClick }: HomeHeroProps) {
  return (
    <section className="px-4 pb-1 pt-2">
      {/* Motivational Message */}
      <div className="mb-2">
        <div className="mb-1 flex items-center gap-1.5">
          <Flag className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] text-muted-foreground">국적표시, 실시간 IP탐지</span>
        </div>
        <h1 className="text-base font-bold leading-snug text-foreground">
          투명한 대한민국을
          <br />
          클릭 한번으로 만들어보세요
        </h1>
      </div>

      {/* Real-time Trending Polls */}
      <div className="rounded-xl border border-border bg-card p-2.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 shrink-0 text-primary" />
          <h2 className="text-xs font-medium text-foreground">실시간으로 뜨고 있는 여론조사</h2>
        </div>
        {trending.length > 0 ? (
          <TrendingTicker polls={trending} onPollClick={onPollClick} />
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">
            아직 트렌딩 여론조사가 없습니다
          </p>
        )}
      </div>
    </section>
  );
}
