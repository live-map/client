"use client";

import { useState, useEffect } from "react";
import { Flame, Users, MessageCircle } from "lucide-react";
import type { PollType } from "@/components/polls/types/poll-types";

interface Comment {
  id: string;
  author: string;
  content: string;
  side: "pro" | "con" | string;
  likes: number;
}

interface PollOption {
  id: string;
  label: string;
  percent: number;
  color: string;
}

interface HotDebateProps {
  debate: {
    id: string;
    title: string;
    pollType?: PollType;
    // binary/yesno 타입용
    proLabel?: string;
    conLabel?: string;
    proPercent?: number;
    conPercent?: number;
    // 다른 타입용
    options?: PollOption[];
    // scale 타입용
    scaleAverage?: number;
    // 공통
    totalVotes: number;
    comments: Comment[];
  };
  onClick: () => void;
}

export function HotDebate({ debate, onClick }: HotDebateProps) {
  const [displayPro, setDisplayPro] = useState(0);
  const [displayCon, setDisplayCon] = useState(0);
  const [displayOptions, setDisplayOptions] = useState<PollOption[]>([]);
  const [currentCommentIndex, setCurrentCommentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [liveCount, setLiveCount] = useState(debate.totalVotes);

  // Animate percentage on mount (빠르게) - 타입 변경시 리셋
  useEffect(() => {
    // 초기값 리셋
    setDisplayPro(0);
    setDisplayCon(0);
    setDisplayOptions(debate.options?.map((opt) => ({ ...opt, percent: 0 })) || []);
    setCurrentCommentIndex(0);
    setLiveCount(debate.totalVotes);

    const duration = 400;
    const steps = 20;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      if (debate.proPercent && debate.conPercent) {
        setDisplayPro(Math.round(debate.proPercent * easeOut * 10) / 10);
        setDisplayCon(Math.round(debate.conPercent * easeOut * 10) / 10);
      }

      // 다른 타입 옵션들 애니메이션
      if (debate.options) {
        setDisplayOptions(
          debate.options.map((opt) => ({
            ...opt,
            percent: Math.round(opt.percent * easeOut * 10) / 10,
          }))
        );
      }

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [
    debate.id,
    debate.pollType,
    debate.proPercent,
    debate.conPercent,
    debate.options,
    debate.totalVotes,
  ]);

  // Rotate comments
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentCommentIndex((prev) => (prev + 1) % debate.comments.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [debate.comments.length]);

  // liveCount는 실제 totalVotes를 반영
  useEffect(() => {
    setLiveCount(debate.totalVotes);
  }, [debate.totalVotes]);

  const currentComment = debate.comments[currentCommentIndex];

  const pollType = debate.pollType || "binary";
  const isPro = currentComment?.side === "pro";
  const difference =
    debate.proPercent && debate.conPercent ? Math.abs(debate.proPercent - debate.conPercent) : 0;
  const isTight = difference <= 10;

  // 투표 UI 렌더링 함수
  const renderVoteUI = () => {
    // binary / yesno 타입
    if (pollType === "binary" || pollType === "yesno") {
      return (
        <div className="px-4 pb-3">
          <div className="relative h-10 rounded-lg overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 flex items-center justify-start pl-3 transition-all duration-500"
              style={{ width: `${displayPro}%` }}
            >
              <span className="text-white font-bold text-sm">{displayPro}%</span>
            </div>
            <div
              className="h-full bg-gradient-to-l from-rose-500 to-rose-400 flex items-center justify-end pr-3 transition-all duration-500"
              style={{ width: `${displayCon}%` }}
            >
              <span className="text-white font-bold text-sm">{displayCon}%</span>
            </div>
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 -translate-x-1/2" />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-blue-600 font-medium">{debate.proLabel}</span>
            <span className="text-xs text-rose-600 font-medium">{debate.conLabel}</span>
          </div>
        </div>
      );
    }

    // multiple / prediction 타입
    if (pollType === "multiple" || pollType === "prediction") {
      const topOptions = displayOptions.slice(0, 3);
      return (
        <div className="px-4 pb-3 space-y-2">
          {topOptions.map((option) => (
            <div key={option.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground font-medium truncate flex-1">
                  {option.label}
                </span>
                <span className="text-xs font-bold ml-2" style={{ color: option.color }}>
                  {option.percent}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${option.percent}%`, backgroundColor: option.color }}
                />
              </div>
            </div>
          ))}
          {debate.options && debate.options.length > 3 && (
            <p className="text-[10px] text-muted-foreground text-center">
              +{debate.options.length - 3}개 더보기
            </p>
          )}
        </div>
      );
    }

    // scale 타입
    if (pollType === "scale") {
      const average = debate.scaleAverage || 5;
      return (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">평균 점수</span>
            <span className="text-2xl font-bold text-primary">{average.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">/ 10</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
              style={{ width: `${average * 10}%` }}
            />
          </div>
        </div>
      );
    }

    // ranking 타입
    if (pollType === "ranking") {
      const topOptions = displayOptions.slice(0, 3);
      return (
        <div className="px-4 pb-3 space-y-1.5">
          {topOptions.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                  index === 0 ? "bg-amber-500" : index === 1 ? "bg-gray-400" : "bg-amber-700"
                }`}
              >
                {index + 1}
              </span>
              <span className="text-xs text-foreground flex-1 truncate">{option.label}</span>
              <span className="text-[10px] text-muted-foreground">평균 {option.percent}위</span>
            </div>
          ))}
        </div>
      );
    }

    // checkbox 타입
    if (pollType === "checkbox") {
      const topOptions = displayOptions.slice(0, 3);
      return (
        <div className="px-4 pb-3 space-y-2">
          {topOptions.map((option) => (
            <div key={option.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground font-medium truncate flex-1">
                  {option.label}
                </span>
                <span className="text-xs font-bold ml-2" style={{ color: option.color }}>
                  {option.percent}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${option.percent}%`, backgroundColor: option.color }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <section className="px-4 py-4">
      <button type="button" onClick={onClick} className="w-full text-left">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="relative">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-semibold text-orange-500">지금 가장 뜨거운 토론</span>
          {isTight && (
            <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
              접전
            </span>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-border/80 transition-all duration-200 hover:-translate-y-0.5">
          {/* Title */}
          <div className="p-4 pb-3">
            <h3 className="font-bold text-foreground text-sm leading-snug">{debate.title}</h3>
          </div>

          {/* Vote Bar - 타입별 UI */}
          {renderVoteUI()}

          {/* Live Stats */}
          <div className="px-4 pb-3 flex items-center gap-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3 h-3" />
              <span className="text-[11px]">
                <span className="font-semibold text-foreground">{liveCount.toLocaleString()}</span>
                명 참여
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-600 font-medium">LIVE</span>
            </div>
          </div>

          {/* Best Comments */}
          <div className="border-t border-border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <MessageCircle className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">
                실시간 베스트 댓글
              </span>
            </div>

            <div className="relative h-[52px] overflow-hidden">
              <div
                className={`absolute inset-x-0 transition-all duration-300 ${
                  isAnimating ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
                }`}
              >
                {pollType === "binary" || pollType === "yesno" ? (
                  <div
                    className={`flex items-start gap-2 p-2 rounded-lg ${
                      isPro
                        ? "bg-blue-50 border-l-2 border-blue-400"
                        : "bg-rose-50 border-l-2 border-rose-400"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-semibold ${isPro ? "text-blue-600" : "text-rose-600"}`}
                        >
                          {currentComment?.author}
                        </span>
                        <span
                          className={`text-[9px] px-1 py-0.5 rounded ${
                            isPro ? "bg-blue-100 text-blue-600" : "bg-rose-100 text-rose-600"
                          }`}
                        >
                          {isPro ? debate.proLabel : debate.conLabel}
                        </span>
                      </div>
                      <p className="text-xs text-foreground mt-0.5 line-clamp-1">
                        {currentComment?.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border-l-2 border-primary">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-foreground">
                          {currentComment?.author}
                        </span>
                      </div>
                      <p className="text-xs text-foreground mt-0.5 line-clamp-1">
                        {currentComment?.content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500">
            <p className="text-center text-white text-xs font-medium">탭하여 토론에 참여하기</p>
          </div>
        </div>
      </button>
    </section>
  );
}
