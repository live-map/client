"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PollsHeader } from "@/components/polls/layout/polls-header";
import { HomeHero } from "@/components/polls/home/home-hero";
import { SuggestSection } from "@/components/polls/home/suggest-section";
import { VoteCard } from "@/components/polls/poll/vote-card";
import { getPollById, getUserVote } from "@/app/actions/polls";
import type { PollCardData, PollWithDetails } from "@/app/actions/polls/queries";
import type { Vote } from "@/lib/generated/prisma/client";

interface PollsHomeClientProps {
  highlight: PollCardData | null;
  trending: PollCardData[];
  suggested: PollCardData[];
  isLoggedIn: boolean;
  userName?: string | null;
}

export function PollsHomeClient({
  highlight,
  trending,
  suggested,
  isLoggedIn,
  userName,
}: PollsHomeClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"poll" | "community">("poll");

  // Merge highlight into trending (deduplicated, highlight first)
  const allTrending = useMemo(() => {
    if (!highlight) return trending;
    const trendingIds = new Set(trending.map((p) => p.id));
    if (trendingIds.has(highlight.id)) return trending;
    return [highlight, ...trending];
  }, [highlight, trending]);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<PollWithDetails | null>(null);
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [isVoteCardOpen, setIsVoteCardOpen] = useState(false);

  useEffect(() => {
    if (!selectedPollId) return;

    let cancelled = false;

    async function fetchPollDetails() {
      const [poll, vote] = await Promise.all([
        getPollById(selectedPollId!),
        getUserVote(selectedPollId!),
      ]);
      if (cancelled) return;
      if (poll) {
        setSelectedPoll(poll);
        setUserVote(vote);
        setIsVoteCardOpen(true);
      }
    }

    fetchPollDetails();
    return () => {
      cancelled = true;
    };
  }, [selectedPollId]);

  const handlePollClick = (id: string) => {
    setSelectedPollId(id);
  };

  const handleVoteCardClose = () => {
    setIsVoteCardOpen(false);
    setSelectedPollId(null);
    setSelectedPoll(null);
    setUserVote(null);
  };

  const handleCreateClick = () => {
    router.push("/polls/suggest/new");
  };

  return (
    <>
      <PollsHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLoggedIn={isLoggedIn}
        userName={userName}
      />

      {activeTab === "poll" ? (
        <div>
          <HomeHero trending={allTrending} onPollClick={handlePollClick} />

          <SuggestSection
            polls={suggested}
            onCreateClick={handleCreateClick}
            onPollClick={handlePollClick}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <p className="text-lg font-medium text-muted-foreground">커뮤니티 준비 중입니다</p>
          <p className="mt-2 text-sm text-muted-foreground">조금만 기다려주세요!</p>
        </div>
      )}

      {selectedPoll && (
        <VoteCard
          poll={selectedPoll}
          isOpen={isVoteCardOpen}
          onClose={handleVoteCardClose}
          isLoggedIn={isLoggedIn}
          userVotedOptionId={userVote?.optionId}
        />
      )}
    </>
  );
}
