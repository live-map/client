"use client";

import { useRouter } from "next/navigation";
import { HomeHero } from "@/components/polls/home/home-hero";
import { HotDebate } from "@/components/polls/home/hot-debate";
import { PollList } from "@/components/polls/home/poll-list";
import { UserPollSection } from "@/components/polls/home/user-poll-section";
import type { PollCardData, HotDebateData } from "@/app/actions/polls/queries";

function formatEndDate(date: Date | string | null | undefined): string | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const ms = Date.now() - new Date(date).getTime();
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

interface PollsHomeClientProps {
  polls: PollCardData[];
  hotDebate: HotDebateData | null;
  suggested: PollCardData[];
}

export function PollsHomeClient({ polls, hotDebate, suggested }: PollsHomeClientProps) {
  const router = useRouter();

  const handlePollClick = (id: string) => {
    router.push(`/polls/${id}`);
  };

  const handleCreatePoll = () => {
    router.push("/polls/suggest/create");
  };

  // API PollCardData → PollList component props
  const pollListItems = polls.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category ?? "기타",
    image: p.imageUrl ?? undefined,
    totalVotes: p.totalVotes,
    endDate: formatEndDate(p.endsAt),
  }));

  // API PollCardData → UserPollSection component props
  const userPollItems = suggested.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category ?? "기타",
    author: p.user?.name ?? "익명",
    likes: p.viewCount,
    comments: 0,
    createdAt: formatRelativeTime(p.createdAt),
  }));

  // HotDebate - add pollType for the component
  const hotDebateWithType = hotDebate ? { ...hotDebate, pollType: "binary" as const } : null;

  return (
    <>
      <HomeHero />

      {hotDebateWithType && (
        <HotDebate
          debate={hotDebateWithType}
          onClick={() => handlePollClick(hotDebateWithType.id)}
        />
      )}

      <PollList polls={pollListItems} onPollClick={handlePollClick} />

      <UserPollSection
        polls={userPollItems}
        onCreateClick={handleCreatePoll}
        onPollClick={handlePollClick}
      />
    </>
  );
}
