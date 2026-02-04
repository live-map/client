"use client";

import { motion } from "motion/react";
import { Users, Flame, TrendingUp } from "lucide-react";
import type { PollCardData } from "@/app/actions/polls/queries";

interface TrendingTickerItemProps {
  poll: PollCardData;
  rank: number;
  isCentered: boolean;
  onClick: () => void;
}

export function TrendingTickerItem({ poll, rank, isCentered, onClick }: TrendingTickerItemProps) {
  const leadingOption = poll.options.reduce(
    (max, opt) => (opt.voteCount > max.voteCount ? opt : max),
    poll.options[0]!
  );
  const leadingPct = poll.totalVotes > 0 ? (leadingOption.voteCount / poll.totalVotes) * 100 : 0;
  const categoryLabel = poll.type === "OFFICIAL" ? "공식" : "제안";

  if (!isCentered) {
    // Compact row — dimmed, smaller
    return (
      <motion.button
        type="button"
        onClick={onClick}
        className="flex h-full w-full items-center gap-2 rounded-lg px-2 text-left transition-colors hover:bg-muted/50"
        animate={{ opacity: 0.5, filter: "blur(0.5px)" }}
        transition={{ duration: 0.3 }}
      >
        <span className="min-w-[18px] text-xs font-bold text-primary">{rank}</span>
        <p className="flex-1 text-xs text-foreground line-clamp-1">{poll.title}</p>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-[10px] text-muted-foreground">
            {poll.totalVotes.toLocaleString()}명
          </span>
          {rank <= 2 && <TrendingUp className="h-3 w-3 text-primary/60" />}
        </div>
      </motion.button>
    );
  }

  // Expanded center card — full detail
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="flex h-full w-full flex-col rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-left"
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {rank}
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
          {categoryLabel}
        </span>
        {rank === 1 && <Flame className="h-3.5 w-3.5 text-destructive" />}
        <p className="flex-1 text-sm font-bold text-foreground leading-snug line-clamp-1">
          {poll.title}
        </p>
      </div>

      {poll.description && (
        <p className="mt-1 pl-7 text-[11px] text-muted-foreground leading-relaxed line-clamp-1">
          {poll.description}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pl-7">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${leadingPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
          <Users className="h-3 w-3" />
          <span className="text-[10px]">{poll.totalVotes.toLocaleString()}명</span>
        </div>
      </div>
    </motion.button>
  );
}
