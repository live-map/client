"use client";

import { Plus, Eye, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PollCardData } from "@/app/actions/polls/queries";

interface SuggestSectionProps {
  polls: PollCardData[];
  onCreateClick: () => void;
  onPollClick: (id: string) => void;
}

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

export function SuggestSection({ polls, onCreateClick, onPollClick }: SuggestSectionProps) {
  return (
    <section className="bg-muted/50 px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-foreground">여론조사 제안하기</h2>
          <p className="mt-1 text-sm text-muted-foreground">궁금한 안건을 직접 제안해보세요</p>
        </div>
        <Button size="sm" className="gap-1" onClick={onCreateClick}>
          <Plus className="h-4 w-4" />
          만들기
        </Button>
      </div>

      <div className="space-y-2">
        {polls.map((poll, index) => (
          <button
            key={poll.id}
            type="button"
            onClick={() => onPollClick(poll.id)}
            className="w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                  <p className="text-sm font-medium text-foreground line-clamp-2">{poll.title}</p>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {poll.user?.name && <span>{poll.user.name}</span>}
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{poll.viewCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{poll.totalVotes}</span>
                  </div>
                  <span>{formatTimeAgo(new Date(poll.createdAt))}</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="mt-4 w-full py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        더보기
      </button>
    </section>
  );
}
