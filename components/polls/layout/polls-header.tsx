"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { User } from "lucide-react";

interface NavigationProps {
  activeTab: "poll" | "community";
  onTabChange: (tab: "poll" | "community") => void;
}

export function PollsHeader({ activeTab, onTabChange }: NavigationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 상단 근처인지 체크
      setIsAtTop(currentScrollY < 10);

      // 스크롤 방향에 따라 헤더 표시/숨김
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        // 아래로 스크롤 & 80px 이상 내려갔을 때 숨김
        setIsVisible(false);
      } else {
        // 위로 스크롤하면 표시
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      } ${
        isAtTop
          ? "bg-background border-b border-border"
          : "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex-1" />
        <nav className="flex gap-6">
          <button
            type="button"
            onClick={() => onTabChange("poll")}
            className={`relative text-[13px] font-medium pb-0.5 transition-colors ${
              activeTab === "poll"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            여론조사
            {activeTab === "poll" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onTabChange("community")}
            className={`relative text-[13px] font-medium pb-0.5 transition-colors ${
              activeTab === "community"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            커뮤니티
            {activeTab === "community" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        </nav>
        <div className="flex-1 flex justify-end">
          <Link
            href="/polls/login"
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-md transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">로그인</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
