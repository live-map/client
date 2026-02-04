"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, ChevronDown, ChevronUp } from "lucide-react";
import type { PollCardData } from "@/app/actions/polls/queries";

const CYCLE_INTERVAL = 4000;

const INTERACTION_SHORT_LABELS: Record<string, string> = {
  BINARY: "A vs B",
  EMOJI_REACTION: "이모지",
  SLIDER: "스펙트럼",
  MULTIPLE_CHOICE: "복수선택",
  RANKING: "순위",
};

interface TrendingTickerProps {
  polls: PollCardData[];
  onPollClick: (id: string) => void;
}

export function TrendingTicker({ polls, onPollClick }: TrendingTickerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const displayPolls = polls.slice(0, 3);

  // Auto-cycle highlight
  useEffect(() => {
    if (isExpanded || displayPolls.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % displayPolls.length);
    }, CYCLE_INTERVAL);
    return () => clearInterval(id);
  }, [isExpanded, displayPolls.length]);

  // Expanded: show all polls
  if (isExpanded) {
    return (
      <div>
        <motion.div
          className="space-y-0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {polls.map((poll, i) => {
            const interactionLabel = INTERACTION_SHORT_LABELS[poll.interactionType];
            const leading = poll.options.reduce(
              (max, opt) => (opt.voteCount > max.voteCount ? opt : max),
              poll.options[0]!
            );
            const pct = poll.totalVotes > 0 ? (leading.voteCount / poll.totalVotes) * 100 : 0;

            return (
              <motion.button
                key={poll.id}
                type="button"
                onClick={() => onPollClick(poll.id)}
                className="flex w-full items-start gap-2.5 px-1 py-2.5 text-left transition-colors hover:bg-muted/30"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
                      {poll.title}
                    </p>
                    {interactionLabel && (
                      <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                        {interactionLabel}
                      </span>
                    )}
                  </div>
                  {poll.description && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                      {poll.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span className="text-[10px]">{poll.totalVotes.toLocaleString()}명</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="mt-1 flex w-full items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label="접기"
        >
          접기
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Collapsed: compact v0-style list with auto-highlight
  return (
    <div>
      <div className="space-y-0.5">
        {displayPolls.map((poll, i) => {
          const isActive = i === activeIndex;
          const interactionLabel = INTERACTION_SHORT_LABELS[poll.interactionType];

          return (
            <button
              key={poll.id}
              type="button"
              onClick={() => onPollClick(poll.id)}
              className="relative flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50"
            >
              {/* Active highlight indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-primary/5"
                    layoutId="trending-highlight"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>

              <span
                className={`relative z-10 min-w-[18px] text-xs font-bold ${isActive ? "text-primary" : "text-primary/60"}`}
              >
                {i + 1}
              </span>
              <p className="relative z-10 flex-1 text-xs text-foreground line-clamp-1">
                {poll.title}
              </p>
              <div className="relative z-10 flex shrink-0 items-center gap-1.5">
                {interactionLabel && (
                  <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-medium text-primary">
                    {interactionLabel}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {poll.totalVotes.toLocaleString()}명
                </span>
                {i === 0 && (
                  <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold text-destructive">
                    HOT
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {polls.length > 3 && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="mt-1 flex w-full items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label="전체 목록 펼치기"
        >
          펼치기
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
