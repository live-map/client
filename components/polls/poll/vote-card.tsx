"use client";

import { useState, useTransition } from "react";
import { X, FileText, ExternalLink, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { castVote } from "@/app/actions/polls";
import type { PollWithDetails } from "@/app/actions/polls/queries";
import { CANDIDATE_MAP } from "@/lib/constants/candidates";

const OPTION_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
  "#6366F1", // indigo
  "#14B8A6", // teal
];

const SOURCE_TYPE_LABELS: Record<string, string> = {
  NEWS: "뉴스",
  PAPER: "논문",
  ARTICLE: "기사",
  VIDEO: "영상",
  OTHER: "기타",
};

interface VoteCardProps {
  poll: PollWithDetails;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  userVotedOptionId?: string | null;
}

export function VoteCard({ poll, isOpen, onClose, isLoggedIn, userVotedOptionId }: VoteCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(!!userVotedOptionId);
  const [showSources, setShowSources] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleVote = () => {
    if (!selectedOption) return;

    if (!isLoggedIn) {
      toast.error("로그인이 필요합니다");
      return;
    }

    startTransition(async () => {
      const result = await castVote({ pollId: poll.id, optionId: selectedOption });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("투표가 완료되었습니다");
        setHasVoted(true);
      }
    });
  };

  const handleClose = () => {
    setSelectedOption(null);
    setShowSources(false);
    onClose();
  };

  if (!isOpen) return null;

  const isPollActive = poll.status === "ACTIVE";
  const showResults = hasVoted || !isPollActive;
  const endDate = poll.endsAt ? new Date(poll.endsAt).toLocaleDateString("ko-KR") : null;
  const categoryLabel = poll.type === "OFFICIAL" ? "공식 여론조사" : "제안";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
        role="button"
        tabIndex={0}
        aria-label="닫기"
      />

      {/* Card */}
      <div className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-t-2xl bg-card shadow-2xl animate-in slide-in-from-bottom duration-300 md:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
            {categoryLabel}
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 transition-colors hover:bg-muted"
            aria-label="닫기"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-4">
          <h2 className="mb-2 text-lg font-bold text-foreground text-balance">{poll.title}</h2>

          {poll.description && (
            <p className="mb-4 text-sm text-muted-foreground">{poll.description}</p>
          )}

          {/* Meta Info */}
          <div className="mb-6 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{poll.totalVotes.toLocaleString()}명 참여</span>
            </div>
            {endDate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{endDate}까지</span>
              </div>
            )}
          </div>

          {/* Voting or Results */}
          {!showResults ? (
            <div className="mb-6 space-y-3">
              <p className="mb-3 text-sm font-medium text-foreground">투표할 후보를 선택해주세요</p>
              {poll.options.map((option, index) => {
                const candidateInfo = CANDIDATE_MAP[option.text];
                const color = candidateInfo?.color ?? OPTION_COLORS[index % OPTION_COLORS.length]!;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedOption(option.id)}
                    disabled={isPending}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                      selectedOption === option.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-card"
                      style={{ backgroundColor: color }}
                    >
                      {option.text[0]}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{option.text}</p>
                      {candidateInfo && (
                        <p className="text-xs text-muted-foreground">{candidateInfo.party}</p>
                      )}
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border-2 ${
                        selectedOption === option.id
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selectedOption === option.id && (
                        <svg
                          className="h-full w-full text-primary-foreground"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mb-6 space-y-4">
              <p className="mb-3 text-sm font-medium text-foreground">현재 투표 결과</p>
              <div className="grid grid-cols-2 gap-3">
                {poll.options.map((option, index) => {
                  const candidateInfo = CANDIDATE_MAP[option.text];
                  const color =
                    candidateInfo?.color ?? OPTION_COLORS[index % OPTION_COLORS.length]!;
                  const percentage =
                    poll.totalVotes > 0 ? (option.voteCount / poll.totalVotes) * 100 : 0;
                  const votedOptionId = userVotedOptionId ?? selectedOption;

                  return (
                    <div
                      key={option.id}
                      className={`relative overflow-hidden rounded-xl border ${
                        option.id === votedOptionId ? "border-primary" : "border-border"
                      }`}
                    >
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{ backgroundColor: color }}
                      />
                      <div className="relative flex flex-col items-center p-3">
                        <div
                          className="mb-2 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-card"
                          style={{ backgroundColor: color }}
                        >
                          {option.text[0]}
                        </div>
                        {candidateInfo && (
                          <p className="text-xs text-muted-foreground">{candidateInfo.party}</p>
                        )}
                        <p className="text-sm font-medium text-foreground">{option.text}</p>
                        <p className="mt-1 text-2xl font-bold" style={{ color }}>
                          {percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sources Toggle */}
          {poll.sources.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowSources(!showSources)}
                className="mb-4 flex w-full items-center justify-between rounded-xl bg-muted p-3"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">관련 자료 확인하기</span>
                </div>
                <span className="text-xs text-muted-foreground">{poll.sources.length}개</span>
              </button>

              {/* Sources List */}
              {showSources && (
                <div className="mb-4 space-y-2 animate-in fade-in duration-200">
                  {poll.sources.map((source) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted"
                    >
                      <div
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          source.sourceType === "NEWS"
                            ? "bg-chart-1/10 text-chart-1"
                            : source.sourceType === "PAPER"
                              ? "bg-chart-2/10 text-chart-2"
                              : "bg-chart-4/10 text-chart-4"
                        }`}
                      >
                        {SOURCE_TYPE_LABELS[source.sourceType] ?? "기타"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground line-clamp-2">{source.title}</p>
                        {source.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{source.description}</p>
                        )}
                      </div>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-border bg-card p-4">
          {!showResults ? (
            <Button
              className="w-full"
              size="lg"
              disabled={!selectedOption || isPending || !isLoggedIn}
              onClick={handleVote}
            >
              {isPending ? "투표 중..." : isLoggedIn ? "투표하기" : "로그인 후 투표"}
            </Button>
          ) : (
            <Button
              className="w-full bg-transparent"
              size="lg"
              variant="outline"
              onClick={handleClose}
            >
              닫기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
