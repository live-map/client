import { auth } from "@/lib/auth";
import { getHomeFeed } from "@/app/actions/polls";
import { PollsHomeClient } from "@/components/polls/home/polls-home-client";

export const dynamic = "force-dynamic";

export default async function PollsPage() {
  const [session, feed] = await Promise.all([auth(), getHomeFeed()]);

  return (
    <PollsHomeClient
      highlight={feed.highlight}
      trending={feed.trending}
      suggested={feed.suggested}
      isLoggedIn={!!session?.user}
      userName={session?.user?.name}
    />
  );
}
