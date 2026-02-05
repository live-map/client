import { PollDetailClient } from "@/components/polls/poll/poll-detail-client";

interface PollDetailPageProps {
  params: Promise<{ pollId: string }>;
}

export default async function PollDetailPage({ params }: PollDetailPageProps) {
  const { pollId } = await params;

  return <PollDetailClient pollId={pollId} />;
}
