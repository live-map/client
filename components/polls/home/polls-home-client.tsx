"use client";

import { useRouter } from "next/navigation";
import { HomeHero } from "@/components/polls/home/home-hero";
import { HotDebate } from "@/components/polls/home/hot-debate";
import { PollList } from "@/components/polls/home/poll-list";
import { UserPollSection } from "@/components/polls/home/user-poll-section";
import { V0_POLL_LIST, V0_HOT_DEBATES_BY_TYPE, V0_USER_POLLS } from "@/lib/mock/polls";

export function PollsHomeClient() {
  const router = useRouter();
  const hotDebate = V0_HOT_DEBATES_BY_TYPE.binary;

  const handlePollClick = (id: string) => {
    router.push(`/polls/${id}`);
  };

  const handleCreatePoll = () => {
    router.push("/polls/suggest/create");
  };

  return (
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
  );
}
