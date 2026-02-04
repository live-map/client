import { auth } from "@/lib/auth";
import { getTrendingPolls, getPollFeed } from "@/app/actions/polls";
import { PollsHomeClient } from "@/components/polls/home/polls-home-client";

export const dynamic = "force-dynamic";

export default async function PollsPage() {
  const [session, trending, initialFeed] = await Promise.all([
    auth(),
    getTrendingPolls(10),
    getPollFeed("popular"),
  ]);

  return (
    <PollsHomeClient
      trending={trending}
      initialFeed={initialFeed}
      isLoggedIn={!!session?.user}
      userName={session?.user?.name}
    />
  );
}
