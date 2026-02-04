export const metadata = {
  title: "Grapoll - 여론조사",
  description: "실시간 여론조사에 참여하고 의견을 나눠보세요",
};

export default function PollsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg pb-20">{children}</main>
    </div>
  );
}
