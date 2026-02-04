"use client";

import { useState, useEffect } from "react";
import { PollsHeader } from "@/components/polls/layout/polls-header";
import { HomeHero } from "@/components/polls/home/home-hero";
import { PollFeed } from "@/components/polls/home/poll-feed";
import { VoteCard } from "@/components/polls/poll/vote-card";
import { getPollById, getUserVote } from "@/app/actions/polls";
import type { PollCardData, PollWithDetails, UserVoteData } from "@/app/actions/polls/queries";

interface PollsHomeClientProps {
  trending: PollCardData[];
  initialFeed: PollCardData[];
  isLoggedIn: boolean;
  userName?: string | null;
}

export function PollsHomeClient({
  trending,
  initialFeed,
  isLoggedIn,
  userName,
}: PollsHomeClientProps) {
  const [activeTab, setActiveTab] = useState<"poll" | "community">("poll");

  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<PollWithDetails | null>(null);
  const [userVote, setUserVote] = useState<UserVoteData | null>(null);
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
          <HomeHero trending={trending} onPollClick={handlePollClick} />
          <PollFeed initialFeed={initialFeed} onPollClick={handlePollClick} />
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
          userVote={userVote}
        />
      )}
    </>
  );
}
