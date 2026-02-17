import { getPollFeed } from "@/app/actions/polls/queries";
import { PollsAllClient } from "@/components/polls/all/polls-all-client";

export const revalidate = 60;

export default async function PollsAllPage() {
  const initialPolls = await getPollFeed("popular");

  return <PollsAllClient initialPolls={initialPolls} />;
}
