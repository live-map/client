import { MainHeader } from "@/components/layout/main-header";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { RightSidebar } from "@/components/layout/right-sidebar";

export const metadata = {
  title: "Grapoll - 여론조사",
  description: "실시간 여론조사에 참여하고 의견을 나눠보세요",
};

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background ambient-bg">
      {/* Mobile header only */}
      <div className="lg:hidden">
        <MainHeader />
      </div>

      <div className="lg:flex lg:justify-center">
        {/* Left sidebar — desktop only */}
        <aside className="hidden lg:block lg:w-[260px] lg:flex-shrink-0">
          <div className="sticky top-0 h-screen">
            <DesktopSidebar />
          </div>
        </aside>

        {/* Main content */}
        <main className="mx-auto max-w-lg pb-20 lg:max-w-none lg:w-[680px] lg:pb-8 lg:px-6 lg:mx-0 relative z-10">
          {children}
        </main>

        {/* Right sidebar — xl only */}
        <aside className="hidden xl:block xl:w-[320px] xl:flex-shrink-0">
          <div className="sticky top-0 h-screen p-4 pt-6">
            <RightSidebar />
          </div>
        </aside>
      </div>
    </div>
  );
}
