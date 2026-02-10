"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { signIn, useSession } from "next-auth/react";

export function MainHeader() {
  const pathname = usePathname();
  const { status } = useSession();
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);

  const activeTab = pathname.startsWith("/community") ? "community" : "poll";

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsAtTop(currentScrollY < 10);

      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsVisible(false);
      } else {
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
          <Link
            href="/"
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
          </Link>
          <Link
            href="/community"
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
          </Link>
        </nav>
        <div className="flex-1 flex justify-end">
          {status === "authenticated" ? (
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">마이페이지</span>
            </Link>
          ) : status === "unauthenticated" ? (
            <button
              type="button"
              onClick={() => signIn()}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-md transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">로그인</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
