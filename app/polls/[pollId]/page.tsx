import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPollById, getUserVote, incrementViewCount } from "@/app/actions/polls";
import { PollDetailClient } from "@/components/polls/poll/poll-detail-client";

interface PollDetailPageProps {
  params: Promise<{ pollId: string }>;
}

export default async function PollDetailPage({ params }: PollDetailPageProps) {
  const { pollId } = await params;
  const [poll, session, userVote] = await Promise.all([
    getPollById(pollId),
    auth(),
    getUserVote(pollId),
  ]);

  if (!poll) {
    notFound();
  }

  // 조회수 증가 (fire-and-forget)
  incrementViewCount(pollId);

  return (
    <PollDetailClient
      poll={poll}
      isLoggedIn={!!session?.user}
      userName={session?.user?.name}
      userVotedOptionId={userVote?.optionId}
    />
  );
}
