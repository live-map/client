import { PollsHomeClient } from "@/components/polls/home/polls-home-client";
import { getPollFeed, getHotDebate, getSuggestedPolls } from "@/app/actions/polls/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [polls, hotDebate, suggested] = await Promise.all([
    getPollFeed("popular"),
    getHotDebate(),
    getSuggestedPolls(),
  ]);

  return <PollsHomeClient polls={polls} hotDebate={hotDebate} suggested={suggested} />;
}
