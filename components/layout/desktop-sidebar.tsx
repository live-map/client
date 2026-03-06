"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  MessageSquare,
  Plus,
  User,
  Sparkles,
  Search,
  FileCheck,
  FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

const navItems = [
  {
    href: "/",
    label: "여론조사",
    icon: BarChart3,
    match: (p: string) => p === "/" || p.startsWith("/polls"),
  },
  {
    href: "/community",
    label: "커뮤니티",
    icon: MessageSquare,
    match: (p: string) => p.startsWith("/community"),
  },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { status } = useAuth();

  return (
    <nav className="glass-sidebar h-full flex flex-col py-6 px-4">
      {/* Branding */}
      <Link href="/" className="flex items-center gap-2 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-sidebar-foreground tracking-tight">Grapoll</span>
      </Link>

      {/* Navigation */}
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* AI CTA Card */}
      <Link href="/polls/suggest/new" className="block mt-6 group">
        <div className="rounded-xl p-[1px] bg-gradient-to-b from-primary/60 via-accent/40 to-primary/20 overflow-hidden">
          <div className="rounded-[11px] bg-card px-3.5 py-3 space-y-2.5">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary">AI Research Agent</span>
            </div>
            <p className="text-[13px] font-bold text-foreground leading-snug">
              여론조사를 만들면 <span className="text-primary">AI가 팩트를 조사</span>해요
            </p>
            <div className="flex items-center gap-1">
              {[
                { icon: Search, label: "수집" },
                { icon: FileCheck, label: "분석" },
                { icon: FileText, label: "리포트" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/60">
                    <step.icon className="w-2.5 h-2.5 text-primary" />
                    <span className="text-[9px] font-medium text-muted-foreground">
                      {step.label}
                    </span>
                  </div>
                  {i < 2 && <div className="w-2 h-px bg-border" />}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 pt-1 pb-0.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs group-hover:opacity-90 transition-opacity">
              <Plus className="w-3.5 h-3.5" />
              여론조사 만들기
            </div>
          </div>
        </div>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User */}
      <div className="border-t border-sidebar-border pt-4 mt-4">
        {status === "authenticated" ? (
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <User className="w-5 h-5" />
            마이페이지
          </Link>
        ) : status === "unauthenticated" ? (
          <Link
            href="/auth/signin"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <User className="w-5 h-5" />
            로그인
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
