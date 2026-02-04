"use client";

import { Users, Clock } from "lucide-react";
import type { PollCardData } from "@/app/actions/polls/queries";

const INTERACTION_LABELS: Record<string, string> = {
  SINGLE_CHOICE: "단일 선택",
  BINARY: "양자택일",
  EMOJI_REACTION: "이모지",
  SLIDER: "스펙트럼",
  MULTIPLE_CHOICE: "복수 선택",
  RANKING: "순위",
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function formatTimeLeft(endsAt: Date): string {
  const now = new Date();
  const diff = endsAt.getTime() - now.getTime();
  if (diff <= 0) return "종료됨";
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}시간 남음`;
  const days = Math.floor(hours / 24);
  return `${days}일 남음`;
}

interface PollFeedCardProps {
  poll: PollCardData;
  onClick: () => void;
}

export function PollFeedCard({ poll, onClick }: PollFeedCardProps) {
  const interactionLabel = INTERACTION_LABELS[poll.interactionType];
  const isClosed = poll.status === "CLOSED";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-1">
        {poll.title}
      </h3>
      {poll.description && (
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{poll.description}</p>
      )}

      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        {interactionLabel && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {interactionLabel}
          </span>
        )}
        <div className="flex items-center gap-0.5">
          <Users className="h-3 w-3" />
          <span>{poll.totalVotes.toLocaleString()}</span>
        </div>
        {poll.endsAt && !isClosed && (
          <div className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            <span>{formatTimeLeft(new Date(poll.endsAt))}</span>
          </div>
        )}
        {isClosed ? (
          <span className="text-destructive">종료됨</span>
        ) : (
          <span>{formatTimeAgo(new Date(poll.createdAt))}</span>
        )}
      </div>
    </button>
  );
}
