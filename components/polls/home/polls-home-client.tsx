"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PollsHeader } from "@/components/polls/layout/polls-header";
import { HomeHero } from "@/components/polls/home/home-hero";
import { HotDebate } from "@/components/polls/home/hot-debate";
import { PollList } from "@/components/polls/home/poll-list";
import { UserPollSection } from "@/components/polls/home/user-poll-section";
import { CommunitySection } from "@/components/polls/home/community-section";
import {
  V0_POLL_LIST,
  V0_HOT_DEBATES_BY_TYPE,
  V0_USER_POLLS,
  V0_COMMUNITY_POSTS,
} from "@/lib/mock/polls";

export function PollsHomeClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"poll" | "community">("poll");
  const hotDebate = V0_HOT_DEBATES_BY_TYPE.binary; // 가장 뜨거운 토론 (실제로는 서버에서 결정)

  const handlePollClick = (id: string) => {
    router.push(`/polls/${id}`);
  };

  const handleCreatePoll = () => {
    router.push("/polls/suggest/create");
  };

  return (
    <div className="min-h-screen bg-background">
      <PollsHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-lg mx-auto pb-20">
        {activeTab === "poll" ? (
          <>
            <HomeHero />

            <HotDebate debate={hotDebate} onClick={() => handlePollClick(hotDebate.id)} />

            <PollList polls={V0_POLL_LIST} onPollClick={handlePollClick} />

            <UserPollSection
              polls={V0_USER_POLLS}
              onCreateClick={handleCreatePoll}
              onPollClick={handlePollClick}
            />
          </>
        ) : (
          <CommunitySection posts={V0_COMMUNITY_POSTS} />
        )}
      </main>
    </div>
  );
}
