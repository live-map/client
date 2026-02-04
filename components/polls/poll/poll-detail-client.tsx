"use client";

import { useState } from "react";
import { PollsHeader } from "@/components/polls/layout/polls-header";
import { VoteCard } from "@/components/polls/poll/vote-card";
import type { PollWithDetails, UserVoteData } from "@/app/actions/polls/queries";

interface PollDetailClientProps {
  poll: PollWithDetails;
  isLoggedIn: boolean;
  userName?: string | null;
  userVote?: UserVoteData | null;
}

export function PollDetailClient({ poll, isLoggedIn, userName, userVote }: PollDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"poll" | "community">("poll");

  return (
    <>
      <PollsHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLoggedIn={isLoggedIn}
        userName={userName}
      />

      <VoteCard
        poll={poll}
        isOpen={true}
        onClose={() => {
          window.history.back();
        }}
        isLoggedIn={isLoggedIn}
        userVote={userVote}
      />
    </>
  );
}
