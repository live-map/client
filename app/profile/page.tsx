"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  ChevronRight,
  Vote,
  MessageSquare,
  ThumbsUp,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock user data
const mockUser = {
  nickname: "민주시민",
  email: "user@example.com",
  joinDate: "2024.01.15",
  stats: {
    votes: 156,
    comments: 43,
    likes: 892,
    suggestions: 5,
  },
};

// Mock activity
const mockActivity = [
  { id: "1", type: "vote", title: "딥페이크 처벌 수위를 높여야 할까요?", date: "오늘" },
  { id: "2", type: "comment", title: "국가위기관리단 신설에 대해...", date: "어제" },
  { id: "3", type: "vote", title: "주 4일제 도입, 현실적으로 가능할까요?", date: "2일 전" },
  { id: "4", type: "suggestion", title: "청년 주거 정책 개선 방안", date: "3일 전" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<"activity" | "stats">("activity");

  const menuItems = [
    { icon: Bell, label: "알림 설정", href: "/profile/notifications" },
    { icon: Shield, label: "개인정보 관리", href: "/profile/privacy" },
    { icon: HelpCircle, label: "고객센터", href: "/polls/help" },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "vote":
        return <Vote className="w-3.5 h-3.5 text-primary" />;
      case "comment":
        return <MessageSquare className="w-3.5 h-3.5 text-blue-500" />;
      case "suggestion":
        return <ThumbsUp className="w-3.5 h-3.5 text-green-500" />;
      default:
        return null;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "vote":
        return "투표함";
      case "comment":
        return "댓글 작성";
      case "suggestion":
        return "제안함";
      default:
        return "";
    }
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="font-bold text-foreground">마이페이지</h1>
          </div>
          <Link
            href="/profile/settings"
            className="p-1.5 hover:bg-foreground/5 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>
      </header>

      <div className="pb-20">
        {/* Profile Card */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{mockUser.nickname}</h2>
              <p className="text-sm text-muted-foreground">{mockUser.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">가입일: {mockUser.joinDate}</p>
            </div>
            <Link
              href="/profile/edit"
              className="px-3 py-1.5 text-xs font-medium text-primary border border-primary rounded-full hover:bg-primary/5 transition-colors"
            >
              편집
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{mockUser.stats.votes}</p>
              <p className="text-[10px] text-muted-foreground">투표</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{mockUser.stats.comments}</p>
              <p className="text-[10px] text-muted-foreground">댓글</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{mockUser.stats.likes}</p>
              <p className="text-[10px] text-muted-foreground">받은 추천</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{mockUser.stats.suggestions}</p>
              <p className="text-[10px] text-muted-foreground">제안</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex px-4">
            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "activity"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              활동 내역
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stats")}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "stats"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              통계
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "activity" ? (
          <div className="divide-y divide-border">
            {mockActivity.map((item) => (
              <Link
                key={item.id}
                href={
                  item.type === "suggestion" ? `/polls/suggest/${item.id}` : `/polls/${item.id}`
                }
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {getActivityLabel(item.type)} · {item.date}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">이번 달 활동</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">투표 참여</span>
                  <span className="text-sm font-medium text-foreground">24회</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">댓글 작성</span>
                  <span className="text-sm font-medium text-foreground">12회</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">받은 추천</span>
                  <span className="text-sm font-medium text-foreground">156개</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 mt-3">
              <h3 className="text-sm font-medium text-foreground mb-3">관심 분야</h3>
              <div className="flex flex-wrap gap-1.5">
                {["정치", "경제", "사회", "IT/기술"].map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="mt-4 border-t border-border">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          ))}
        </div>

        {/* Logout */}
        <div className="px-4 mt-6">
          <Button
            variant="outline"
            className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </div>
    </>
  );
}
