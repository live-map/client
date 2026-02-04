"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Pause, Play, ChevronDown, ChevronUp, Users } from "lucide-react";
import { TrendingTickerItem } from "@/components/polls/home/trending-ticker-item";
import type { PollCardData } from "@/app/actions/polls/queries";

const CYCLE_INTERVAL = 4000;
const COMPACT_H = 36;
const CENTER_H = 96;
const GAP = 4;
const TOTAL_H = COMPACT_H + GAP + CENTER_H + GAP + COMPACT_H;

interface TrendingTickerProps {
  polls: PollCardData[];
  onPollClick: (id: string) => void;
}

export function TrendingTicker({ polls, onPollClick }: TrendingTickerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = polls.length;

  const advance = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % count);
  }, [count]);

  // Auto-cycle (pause when expanded)
  useEffect(() => {
    if (isPaused || isExpanded || shouldReduceMotion || count <= 1) return;
    const id = setInterval(advance, CYCLE_INTERVAL);
    return () => clearInterval(id);
  }, [isPaused, isExpanded, shouldReduceMotion, advance, count]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => setIsPaused(false), 5000);
  }, []);

  const prevIdx = (currentIndex - 1 + count) % count;
  const nextIdx = (currentIndex + 1) % count;

  // Reduced motion fallback
  if (shouldReduceMotion || count <= 1) {
    return (
      <div className="space-y-2">
        {polls.slice(0, 3).map((poll, i) => (
          <TrendingTickerItem
            key={poll.id}
            poll={poll}
            rank={i + 1}
            isCentered={i === 0}
            onClick={() => onPollClick(poll.id)}
          />
        ))}
      </div>
    );
  }

  const slots = [
    { idx: prevIdx, pos: "prev" as const, baseY: 0, h: COMPACT_H },
    { idx: currentIndex, pos: "center" as const, baseY: COMPACT_H + GAP, h: CENTER_H },
    { idx: nextIdx, pos: "next" as const, baseY: COMPACT_H + GAP + CENTER_H + GAP, h: COMPACT_H },
  ];

  // --- Expanded: flat list ---
  if (isExpanded) {
    return (
      <div role="region" aria-label="실시간 인기 여론조사">
        <motion.div
          className="space-y-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {polls.map((poll, i) => {
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
                  <p className="text-sm font-semibold text-foreground leading-snug">{poll.title}</p>
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
          className="mt-1 flex w-full items-center justify-center py-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="접기"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // --- Collapsed: animated ticker ---
  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="실시간 인기 여론조사"
    >
      {/* Ticker viewport */}
      <div className="relative overflow-hidden" style={{ height: TOTAL_H }}>
        <AnimatePresence mode="popLayout" initial={false}>
          {slots.map(({ idx, pos, baseY, h }) => (
            <motion.div
              key={`${polls[idx]!.id}-${pos}`}
              className="absolute inset-x-0"
              style={{ height: h }}
              initial={{ opacity: 0, y: pos === "prev" ? -COMPACT_H : TOTAL_H }}
              animate={{ opacity: 1, y: baseY }}
              exit={{ opacity: 0, y: pos === "next" ? TOTAL_H : -COMPACT_H }}
              transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
            >
              <TrendingTickerItem
                poll={polls[idx]!}
                rank={idx + 1}
                isCentered={pos === "center"}
                onClick={() => {
                  if (pos === "center") onPollClick(polls[idx]!.id);
                  else goTo(idx);
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Controls: dots + pause */}
      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {polls.map((_, i) => (
            <button
              key={polls[i]!.id}
              type="button"
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/25"
              }`}
              aria-label={`${i + 1}번째 여론조사로 이동`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIsPaused(!isPaused)}
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={isPaused ? "자동 순환 재개" : "자동 순환 일시정지"}
        >
          {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        </button>
      </div>

      {/* Expand — center bottom */}
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="mt-1 flex w-full items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-label="전체 목록 펼치기"
      >
        펼치기
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      <div className="sr-only" aria-live="polite">
        현재 {currentIndex + 1}위: {polls[currentIndex]?.title}
      </div>
    </div>
  );
}
