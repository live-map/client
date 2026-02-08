import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PollForm } from "@/components/polls/suggest/poll-form";

export const metadata = {
  title: "여론조사 제안 - Grapoll",
  description: "새로운 여론조사를 제안해보세요",
};

export default async function NewPollPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/polls/suggest/new");
  }

  return (
    <div className="mx-auto max-w-lg">
      <PollForm />
    </div>
  );
}
