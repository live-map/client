import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPollById, getUserVote } from "@/app/actions/polls/queries";
import { PollDetailClient } from "@/components/polls/poll/poll-detail-client";

interface PollDetailPageProps {
  params: Promise<{ pollId: string }>;
}

export default async function PollDetailPage({ params }: PollDetailPageProps) {
  const { pollId } = await params;
  const session = await auth();

  const poll = await getPollById(pollId);
  if (!poll) notFound();

  const userVote = session?.user?.id ? await getUserVote(pollId) : null;

  return <PollDetailClient poll={poll} userVote={userVote} isLoggedIn={!!session?.user} />;
}
