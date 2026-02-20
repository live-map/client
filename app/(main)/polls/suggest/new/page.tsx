import { PollForm } from "@/components/polls/suggest/poll-form";

export const metadata = {
  title: "여론조사 제안 - Grapoll",
  description: "새로운 여론조사를 제안해보세요",
};

export default function NewPollPage() {
  return (
    <div className="mx-auto max-w-lg lg:max-w-xl">
      <PollForm />
    </div>
  );
}
