export const metadata = {
  title: "Grapoll - 마이페이지",
  description: "프로필 및 설정 관리",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg">{children}</main>
    </div>
  );
}
