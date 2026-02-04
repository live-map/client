"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PollsHeaderProps {
  activeTab: "poll" | "community";
  onTabChange: (tab: "poll" | "community") => void;
  isLoggedIn: boolean;
  userName?: string | null;
}

export function PollsHeader({ activeTab, onTabChange, isLoggedIn, userName }: PollsHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex-1" />
        <nav className="flex gap-8">
          <button
            type="button"
            onClick={() => onTabChange("poll")}
            className={`pb-1 text-base font-medium transition-colors ${
              activeTab === "poll"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            여론조사
          </button>
          <button
            type="button"
            onClick={() => onTabChange("community")}
            className={`pb-1 text-base font-medium transition-colors ${
              activeTab === "community"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            커뮤니티
          </button>
        </nav>
        <div className="flex flex-1 justify-end">
          {isLoggedIn ? (
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
              <Link href="/polls/suggest/new">
                <User className="h-4 w-4" />
                {userName ?? "마이"}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
              <Link href="/auth/signin">
                <User className="h-4 w-4" />
                로그인
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
