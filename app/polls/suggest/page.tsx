import Link from "next/link";
import { Eye, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSuggestedPolls } from "@/app/actions/polls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "제안된 여론조사 - Grapoll",
  description: "사용자들이 제안한 여론조사 목록",
};

export default async function SuggestPage() {
  const polls = await getSuggestedPolls(20);

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">제안된 여론조사</h1>
        <Button asChild>
          <Link href="/polls/suggest/new">제안하기 +</Link>
        </Button>
      </div>

      {polls.length > 0 ? (
        <div className="space-y-2">
          {polls.map((poll, index) => (
            <Link
              key={poll.id}
              href={`/polls/${poll.id}`}
              className="flex w-full items-start justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{index + 1}</span>
                  <p className="text-sm font-medium text-foreground line-clamp-2">{poll.title}</p>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{poll.viewCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{poll.totalVotes}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">아직 제안된 여론조사가 없습니다</p>
          <Button className="mt-4" asChild>
            <Link href="/polls/suggest/new">첫 번째 제안하기</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
