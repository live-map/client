"use client";

import React from "react";
import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Users,
  Clock,
  ExternalLink,
  ThumbsUp,
  Share2,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { PollWithDetails, UserVoteData, PollCommentData } from "@/app/actions/polls/queries";
import {
  castVote,
  createPollComment,
  incrementViewCount,
  deletePoll,
  likePollComment,
  deletePollComment,
  revalidatePoll,
} from "@/app/actions/polls/mutations";
import { FloatingVoteBar } from "@/components/polls/types/poll-types";
import type { PollType, PollOption } from "@/components/polls/types/poll-types";
import { useLoginModal } from "@/components/auth/login-modal";

// ========================================
// 인라인 출처 컴포넌트
// ========================================

function InlineSource({ name, url }: { name: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-muted/70 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors ml-1"
    >
      <span>{name}</span>
      <ExternalLink className="w-2.5 h-2.5" />
    </a>
  );
}

// ========================================
// 마크다운 렌더러
// ========================================

function MarkdownRenderer({ content }: { content: string }) {
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim() === "") {
        continue;
      }

      // 인라인 출처만 있는 줄 [^출처명|URL]
      if (line.trim().match(/^\[\^[^\]]+\|[^\]]+\]$/)) {
        const sourceMatch = line.trim().match(/\[\^([^\|]+)\|([^\]]+)\]/);
        if (sourceMatch) {
          elements.push(
            <div key={currentIndex++} className="mb-3 -mt-1">
              <InlineSource name={sourceMatch[1]} url={sourceMatch[2]} />
            </div>
          );
          continue;
        }
      }

      if (line.trim() === "---") {
        elements.push(<hr key={currentIndex++} className="my-4 border-border" />);
        continue;
      }

      if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={currentIndex++}
            className="text-base font-bold text-foreground mt-4 mb-2 leading-tight"
          >
            {line.slice(3)}
          </h2>
        );
        continue;
      }

      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={currentIndex++} className="text-sm font-semibold text-foreground mt-3 mb-1.5">
            {line.slice(4)}
          </h3>
        );
        continue;
      }

      if (line.startsWith("![")) {
        const match = line.match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          elements.push(
            <figure key={currentIndex++} className="my-3">
              <div className="relative w-full h-32 rounded-lg overflow-hidden">
                <Image
                  src={match[2] || "/placeholder.svg"}
                  alt={match[1]}
                  fill
                  className="object-cover"
                />
              </div>
            </figure>
          );
          continue;
        }
      }

      if (line.startsWith("> ")) {
        const quoteLines = [line.replace("> ", "")];
        while (i + 1 < lines.length && lines[i + 1].startsWith("> ")) {
          i++;
          quoteLines.push(lines[i].replace("> ", ""));
        }
        elements.push(
          <blockquote
            key={currentIndex++}
            className="my-3 pl-3 border-l-2 border-muted-foreground/30 py-1.5"
          >
            <p className="text-sm text-muted-foreground leading-normal">{quoteLines.join(" ")}</p>
          </blockquote>
        );
        continue;
      }

      if (line.startsWith("- ")) {
        const listItems = [line.replace("- ", "")];
        while (i + 1 < lines.length && lines[i + 1].startsWith("- ")) {
          i++;
          listItems.push(lines[i].replace("- ", ""));
        }
        elements.push(
          <ul key={currentIndex++} className="my-2 space-y-1">
            {listItems.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-foreground/90 leading-normal"
              >
                <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
              </li>
            ))}
          </ul>
        );
        continue;
      }

      elements.push(
        <p key={currentIndex++} className="text-sm text-foreground/90 leading-normal mb-2">
          <span dangerouslySetInnerHTML={{ __html: parseInline(line) }} />
        </p>
      );
    }

    return elements;
  };

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const parseInline = (text: string) => {
    const escaped = escapeHtml(text);
    const html = escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-medium text-foreground">$1</strong>')
      .replace(
        /\[(.*?)\]\((https?:\/\/[^\)]*)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
      );
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["strong", "a"],
      ALLOWED_ATTR: ["href", "target", "rel", "class"],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^https?:\/\//i,
    });
  };

  return <article className="prose-custom">{parseMarkdown(content)}</article>;
}

// ========================================
// Research Progress Component
// ========================================

const RESEARCH_STEPS = [
  { key: "planning", label: "계획", description: "주제 관점을 분석하고 검색 전략을 수립합니다" },
  { key: "searching", label: "검색", description: "웹, 학술, 팩트체크 출처를 수집합니다" },
  { key: "analyzing", label: "분석", description: "수집된 자료를 종합 분석합니다" },
  { key: "reviewing", label: "검토", description: "리포트의 정확성과 균형을 검토합니다" },
] as const;

function ResearchProgress({ pollId }: { pollId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("pending");
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/polls/${pollId}/research/status`);
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);
        if (data.currentStep || data.current_step) {
          setCurrentStep(data.currentStep || data.current_step);
        }
      } catch {
        // ignore fetch errors
      }
    };

    pollStatus();
    // Only poll repeatedly if research is actually running
    const interval = setInterval(() => {
      if (status === "running") pollStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, [pollId, status]);

  useEffect(() => {
    if (status === "completed") {
      const timeout = setTimeout(async () => {
        await revalidatePoll(pollId);
        router.refresh();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [status, pollId, router]);

  // pending = 리서치가 아직 시작되지 않음 (또는 존재하지 않음) → 표시 안 함
  if (status === "pending" || status === "failed") {
    return null;
  }

  const stepIndex = RESEARCH_STEPS.findIndex((s) => s.key === currentStep);
  const activeIndex = status === "completed" ? RESEARCH_STEPS.length : stepIndex;
  const activeStep =
    activeIndex >= 0 && activeIndex < RESEARCH_STEPS.length ? RESEARCH_STEPS[activeIndex] : null;

  return (
    <section className="px-4 mt-6">
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">AI</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {status === "completed" ? "팩트 리서치 완료" : "팩트 리서치 진행 중"}
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {status === "completed" ? "분석 완료!" : "AI가 다양한 출처를 조사하고 있습니다"}
            </p>
          </div>
        </div>

        {/* Steps with connector lines */}
        <div className="flex items-start justify-between relative">
          {RESEARCH_STEPS.map((step, i) => {
            const isDone = i < activeIndex || status === "completed";
            const isActive = i === activeIndex && status === "running";

            return (
              <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1 relative">
                {/* Connector line */}
                {i < RESEARCH_STEPS.length - 1 && (
                  <div className="absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone
                          ? "bg-primary"
                          : isActive
                            ? "bg-gradient-to-r from-primary/50 to-muted"
                            : "bg-muted"
                      }`}
                    />
                  </div>
                )}

                {/* Circle */}
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : isActive
                          ? "bg-primary/20 text-primary ring-2 ring-primary/40 scale-110"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? "\u2713" : i + 1}
                  </div>
                  {/* Ping pulse for active step */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] ${
                    isDone || isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Active step description */}
        {activeStep && status === "running" && (
          <p className="text-[11px] text-muted-foreground text-center mt-3 animate-pulse">
            {activeStep.description}
          </p>
        )}
      </div>
    </section>
  );
}

// ========================================
// Helpers
// ========================================

const INTERACTION_TYPE_TO_POLL_TYPE: Record<string, PollType> = {
  BINARY: "binary",
  SINGLE_CHOICE: "multiple",
  MULTIPLE_CHOICE: "checkbox",
  SLIDER: "scale",
  RANKING: "ranking",
  EMOJI_REACTION: "multiple",
  YES_NO: "yesno",
  PREDICTION: "prediction",
};

const OPTION_COLORS = ["#3B82F6", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#6B7280"];

function mapOptionsToUI(options: PollWithDetails["options"], totalVotes: number): PollOption[] {
  return options
    .sort((a, b) => a.order - b.order)
    .map((opt, i) => ({
      id: opt.id,
      label: opt.text,
      percent: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 1000) / 10 : 0,
      color: OPTION_COLORS[i % OPTION_COLORS.length],
    }));
}

function getSelectedValueFromVote(
  userVote: UserVoteData | null,
  interactionType: string
): string | string[] | number | null {
  if (!userVote) return null;
  switch (interactionType) {
    case "SLIDER":
      return userVote.sliderValue;
    case "MULTIPLE_CHOICE":
      return userVote.selectedOptionIds;
    case "RANKING":
      return userVote.rankingData;
    default:
      return userVote.optionId;
  }
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;
  return date.toLocaleDateString("ko-KR");
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// ========================================
// Main component
// ========================================

interface PollDetailClientProps {
  poll: PollWithDetails;
  userVote: UserVoteData | null;
  isLoggedIn: boolean;
  currentUserId: string | null;
}

export function PollDetailClient({
  poll,
  userVote,
  isLoggedIn,
  currentUserId,
}: PollDetailClientProps) {
  const router = useRouter();
  const { openLoginModal } = useLoginModal();
  const [isPending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 케밥 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!showMenu) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [showMenu]);

  const isAuthor = currentUserId != null && poll.userId != null && currentUserId === poll.userId;
  const [isExpired] = useState(
    () =>
      poll.status === "CLOSED" ||
      (poll.endsAt != null && new Date(poll.endsAt).getTime() < Date.now())
  );

  const pollType = INTERACTION_TYPE_TO_POLL_TYPE[poll.interactionType] || "multiple";
  const uiOptions = mapOptionsToUI(poll.options, poll.totalVotes);

  const [hasVoted, setHasVoted] = useState(!!userVote || isExpired);
  const [selectedValue, setSelectedValue] = useState<string | string[] | number | null>(
    getSelectedValueFromVote(userVote, poll.interactionType)
  );
  const [showVoteBar, setShowVoteBar] = useState(true);
  const [voteBarExpanded, setVoteBarExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);
  // Optimistic comment likes: commentId → likes count
  const [commentLikes, setCommentLikes] = useState<Map<string, number>>(new Map());

  // 조회수 증가
  useEffect(() => {
    incrementViewCount(poll.id);
  }, [poll.id]);

  // 스크롤 시 투표바 표시/숨김
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const isAtBottom = currentScrollY + windowHeight >= documentHeight - 50;
      const isScrollingUp = currentScrollY < lastScrollY;
      const isNearTop = currentScrollY < 100;

      setShowVoteBar(isNearTop || isScrollingUp || isAtBottom);
      lastScrollY = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleVote = (value: string | string[] | number | Record<string, number>) => {
    const voteValue = value as string | string[] | number;

    startTransition(async () => {
      const dto: Parameters<typeof castVote>[0] = {
        pollId: poll.id,
        interactionType: poll.interactionType,
      };

      if (poll.interactionType === "SLIDER") {
        dto.sliderValue = voteValue as number;
      } else if (poll.interactionType === "MULTIPLE_CHOICE") {
        dto.selectedOptionIds = voteValue as string[];
      } else if (poll.interactionType === "RANKING") {
        dto.rankingData = voteValue as string[];
      } else {
        dto.optionId = voteValue as string;
      }

      const result = await castVote(dto);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setSelectedValue(voteValue);
      setHasVoted(true);
      router.refresh();

      setTimeout(() => {
        const resultsSection = document.getElementById("results-section");
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    });
  };

  const handleComment = () => {
    if (!isLoggedIn) {
      openLoginModal("댓글을 작성하려면 로그인이 필요합니다");
      return;
    }
    if (!commentText.trim()) return;

    startTransition(async () => {
      const result = await createPollComment(poll.id, {
        content: commentText.trim(),
        optionId: typeof selectedValue === "string" ? selectedValue : undefined,
      });

      if (result.error) {
        if (result.status === 401) {
          openLoginModal("댓글을 작성하려면 로그인이 필요합니다");
        } else {
          toast.error(result.error);
        }
        return;
      }

      setCommentText("");
      toast.success("댓글이 등록되었습니다");
      router.refresh();
    });
  };

  const handleReply = (parentId: string) => {
    if (!isLoggedIn) {
      openLoginModal("답글을 작성하려면 로그인이 필요합니다");
      return;
    }
    if (!replyText.trim()) return;

    startTransition(async () => {
      const result = await createPollComment(poll.id, {
        content: replyText.trim(),
        parentId,
        optionId: typeof selectedValue === "string" ? selectedValue : undefined,
      });

      if (result.error) {
        if (result.status === 401) {
          openLoginModal("답글을 작성하려면 로그인이 필요합니다");
        } else {
          toast.error(result.error);
        }
        return;
      }

      setReplyText("");
      setReplyingTo(null);
      toast.success("답글이 등록되었습니다");
      router.refresh();
    });
  };

  const handleLikeComment = (commentId: string, currentLikes: number) => {
    if (!isLoggedIn) {
      openLoginModal("좋아요를 누르려면 로그인이 필요합니다");
      return;
    }
    // Optimistic update
    setCommentLikes((prev) => {
      const next = new Map(prev);
      const current = next.get(commentId) ?? currentLikes;
      next.set(commentId, current + 1);
      return next;
    });
    startTransition(async () => {
      const result = await likePollComment(poll.id, commentId);
      if (result.error) {
        // Revert on error
        setCommentLikes((prev) => {
          const next = new Map(prev);
          next.delete(commentId);
          return next;
        });
        toast.error(result.error);
        return;
      }
      // Set server-confirmed value
      const serverLikes = result.data?.likes;
      if (serverLikes != null) {
        setCommentLikes((prev) => {
          const next = new Map(prev);
          next.set(commentId, serverLikes);
          return next;
        });
      }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    setConfirmDialog({
      title: "댓글 삭제",
      description: "댓글을 삭제하시겠습니까?",
      onConfirm: () => {
        setConfirmDialog(null);
        startTransition(async () => {
          const result = await deletePollComment(poll.id, commentId);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("댓글이 삭제되었습니다");
          router.refresh();
        });
      },
    });
  };

  const handleDelete = () => {
    setConfirmDialog({
      title: "여론조사 삭제",
      description: "정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      onConfirm: () => {
        setConfirmDialog(null);
        startTransition(async () => {
          const result = await deletePoll(poll.id);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success("여론조사가 삭제되었습니다");
          router.push("/");
        });
      },
    });
  };

  const getOptionColor = (optionId: string) => {
    return uiOptions.find((o) => o.id === optionId)?.color || "#888";
  };

  const getOptionLabel = (optionId: string) => {
    return uiOptions.find((o) => o.id === optionId)?.label;
  };

  // 투표 결과 UI 렌더링
  const renderResultsUI = () => {
    if (!hasVoted) return null;

    const isSlider = poll.interactionType === "SLIDER";
    const sliderAvg = poll.averageSliderValue;

    return (
      <section id="results-section" className="px-4 mt-6 scroll-mt-16">
        <h2 className="text-sm font-semibold text-foreground mb-3">투표 결과</h2>
        <div className="bg-card border border-border rounded-xl p-4">
          {isSlider ? (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">평균 점수</p>
              <p className="text-3xl font-bold text-primary">
                {sliderAvg != null
                  ? sliderAvg.toFixed(1)
                  : ((selectedValue as number)?.toFixed(1) ?? "-")}
              </p>
              <div className="mt-3 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                  style={{
                    width: `${((sliderAvg ?? (selectedValue as number) ?? 5) / 10) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>1</span>
                <span>10</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {uiOptions.map((option) => {
                const isSelected =
                  selectedValue === option.id ||
                  (Array.isArray(selectedValue) && selectedValue.includes(option.id));
                return (
                  <div key={option.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {option.label}
                        {isSelected && <span className="ml-2 text-xs text-primary">내 선택</span>}
                      </span>
                      <span className="text-sm font-bold" style={{ color: option.color }}>
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
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3 text-center">
            총 {poll.totalVotes.toLocaleString()}명 참여
          </p>
        </div>
      </section>
    );
  };

  // 댓글 렌더링
  const renderComment = (comment: PollCommentData, isReply = false) => {
    const avatarSize = isReply ? "w-6 h-6 text-[9px]" : "w-7 h-7 text-[10px]";
    const nameSize = isReply ? "text-[13px]" : "text-sm";
    const contentSize = isReply ? "text-[13px]" : "text-sm";
    const badgeSize = isReply ? "text-[9px] px-1 py-0.5" : "text-[10px] px-1.5 py-0.5";
    const iconSize = isReply ? "w-2.5 h-2.5" : "w-3 h-3";
    const metaSize = isReply ? "text-[10px]" : "text-[11px]";
    const actionSize = isReply ? "text-[11px]" : "text-xs";

    const optId = comment.optionId;
    const color = optId ? getOptionColor(optId) : "#888";
    const label = optId ? getOptionLabel(optId) : undefined;
    const userName = comment.userName || "익명";

    return (
      <div key={comment.id} className={`flex gap-2${isReply ? "" : ".5"}`}>
        <div
          className={`${avatarSize} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
          style={{ backgroundColor: color }}
        >
          {userName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`${nameSize} font-medium text-foreground`}>{userName}</span>
            {label && (
              <span
                className={`${badgeSize} rounded`}
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                {label}
              </span>
            )}
            <span className={`${metaSize} text-muted-foreground`}>
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
          <p className={`${contentSize} text-foreground/90 mt-1 leading-relaxed`}>
            {comment.content}
          </p>
          <div className={`flex items-center gap-4 mt-1.5 ${actionSize} text-muted-foreground`}>
            <button
              type="button"
              className="flex items-center gap-1 hover:text-primary transition-colors"
              onClick={() => handleLikeComment(comment.id, comment.likes)}
            >
              <ThumbsUp className={iconSize} />
              <span>{commentLikes.get(comment.id) ?? comment.likes}</span>
            </button>
            <button
              type="button"
              className="hover:text-primary transition-colors"
              onClick={() => {
                setReplyingTo(replyingTo === comment.id ? null : comment.id);
                setReplyText("");
              }}
            >
              답글
            </button>
            {currentUserId && comment.userId === currentUserId && (
              <button
                type="button"
                className="hover:text-destructive transition-colors"
                onClick={() => handleDeleteComment(comment.id)}
              >
                삭제
              </button>
            )}
          </div>

          {/* 답글 입력 */}
          {replyingTo === comment.id && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing && replyText.trim()) {
                    handleReply(comment.id);
                  }
                }}
                placeholder="답글을 입력하세요..."
                className="flex-1 px-2.5 py-1.5 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <Button
                size="sm"
                disabled={!replyText.trim() || isPending}
                onClick={() => handleReply(comment.id)}
                className="px-3 h-7 text-xs"
              >
                등록
              </Button>
            </div>
          )}

          {/* 대댓글 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const topLevelComments = poll.comments.filter((c) => !c.parentId);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border lg:border-none lg:bg-transparent lg:backdrop-blur-none lg:relative">
        <div className="flex items-center justify-between px-4 h-12">
          {/* Mobile: back button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">뒤로</span>
          </button>
          {/* Desktop: breadcrumb */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="hover:text-foreground transition-colors"
            >
              여론조사
            </button>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[300px]">{poll.title}</span>
          </nav>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 hover:bg-muted rounded-full transition-colors"
              onClick={() => {
                const url = `${window.location.origin}/polls/${poll.id}`;
                navigator.clipboard.writeText(url).then(
                  () => toast.success("링크가 복사되었습니다"),
                  () => toast.error("링크 복사에 실패했습니다")
                );
              }}
            >
              <Share2 className="w-5 h-5 text-muted-foreground" />
            </button>
            {isAuthor && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        router.push(`/polls/${poll.id}/edit`);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        handleDelete();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="relative h-48 w-full">
          <Image
            src={poll.imageUrl || "/placeholder.svg"}
            alt={poll.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="px-4 -mt-16 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            {poll.category && (
              <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                {poll.category}
              </span>
            )}
            {isExpired && (
              <span className="inline-block text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                마감됨
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground leading-tight text-balance">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{poll.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{poll.totalVotes.toLocaleString()}명 참여</span>
            </div>
            {poll.endsAt && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDate(poll.endsAt)} 마감</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content — AI Research + Comments (full width) */}
      <div className="lg:mt-6">
        <div>
          {/* Research Progress */}
          {!poll.aiContent && <ResearchProgress pollId={poll.id} />}

          {/* AI Article Section */}
          {poll.aiContent && (
            <section className="px-4 mt-6 lg:px-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-foreground">AI</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      투표 전 알아두면 좋은 팩트
                    </h2>
                    {poll.aiUpdatedAt && (
                      <p className="text-[10px] text-muted-foreground">
                        {formatTimeAgo(poll.aiUpdatedAt)} 업데이트
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <MarkdownRenderer content={poll.aiContent} />
            </section>
          )}

          {/* Sources */}
          {poll.sources && poll.sources.length > 0 && (
            <section className="px-4 mt-4 lg:px-0">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">출처</h3>
              <div className="flex flex-wrap gap-1.5">
                {poll.sources.map((source) => (
                  <InlineSource key={source.id} name={source.title} url={source.url} />
                ))}
              </div>
            </section>
          )}

          {/* Results Section — 투표 후에만 표시 */}
          {renderResultsUI()}

          {/* Comments Section — 투표 후에만 표시 */}
          {hasVoted && topLevelComments.length > 0 && (
            <section className="px-4 mt-6 lg:px-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">
                  댓글 {topLevelComments.length}개
                </h2>
              </div>
              <div className="divide-y divide-border">
                {topLevelComments.map((comment) => (
                  <div key={comment.id} className="py-3 first:pt-0">
                    {renderComment(comment)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Desktop inline comment input */}
          {hasVoted && (
            <div className="hidden lg:block px-0 mt-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing && commentText.trim()) {
                      handleComment();
                    }
                  }}
                  placeholder="의견을 남겨보세요..."
                  className="flex-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  size="sm"
                  disabled={!commentText.trim() || isPending}
                  onClick={handleComment}
                  className="px-4"
                >
                  등록
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Vote Bar — always visible */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 pb-[env(safe-area-inset-bottom)] z-40 ${
          showVoteBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-lg mx-auto lg:max-w-2xl">
          {!hasVoted ? (
            <FloatingVoteBar
              pollType={pollType}
              options={uiOptions}
              onVote={handleVote}
              scaleConfig={
                pollType === "scale"
                  ? { min: 1, max: 10, labels: { min: "매우 불만족", max: "매우 만족" } }
                  : undefined
              }
            />
          ) : (
            <div className="px-4 py-2.5">
              {voteBarExpanded ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">다시 투표하기</span>
                    <button
                      type="button"
                      onClick={() => setVoteBarExpanded(false)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      취소
                    </button>
                  </div>
                  <FloatingVoteBar
                    pollType={pollType}
                    options={uiOptions}
                    onVote={(value) => {
                      handleVote(value);
                      setVoteBarExpanded(false);
                    }}
                    scaleConfig={
                      pollType === "scale"
                        ? { min: 1, max: 10, labels: { min: "매우 불만족", max: "매우 만족" } }
                        : undefined
                    }
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {typeof selectedValue === "string" && getOptionColor(selectedValue) && (
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getOptionColor(selectedValue) }}
                      />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {isExpired && !selectedValue && "마감된 여론조사입니다"}
                      {typeof selectedValue === "string" && getOptionLabel(selectedValue) && (
                        <>
                          <span className="font-medium text-foreground">
                            {getOptionLabel(selectedValue)}
                          </span>
                          에 투표함
                        </>
                      )}
                      {typeof selectedValue === "number" && (
                        <>
                          <span className="font-medium text-foreground">{selectedValue}점</span>
                          으로 투표함
                        </>
                      )}
                      {Array.isArray(selectedValue) && (
                        <>
                          <span className="font-medium text-foreground">
                            {selectedValue.length}개
                          </span>{" "}
                          선택함
                        </>
                      )}
                    </span>
                    {!isExpired && (
                      <button
                        type="button"
                        onClick={() => setVoteBarExpanded(true)}
                        className="ml-auto text-[11px] text-primary hover:underline flex-shrink-0"
                      >
                        변경
                      </button>
                    )}
                  </div>

                  {/* 댓글 입력 */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing && commentText.trim()) {
                          handleComment();
                        }
                      }}
                      placeholder="의견을 남겨보세요..."
                      className="flex-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      size="sm"
                      disabled={!commentText.trim() || isPending}
                      onClick={handleComment}
                      className="px-4"
                    >
                      등록
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="max-w-xs rounded-xl">
          <DialogHeader>
            <DialogTitle>{confirmDialog?.title}</DialogTitle>
            <DialogDescription>{confirmDialog?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDialog(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={isPending}
              onClick={confirmDialog?.onConfirm}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
