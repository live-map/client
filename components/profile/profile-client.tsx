"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ArrowLeft,
  Settings,
  ChevronRight,
  MessageSquare,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  User,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileUser {
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string; // ISO string
}

interface ProfileClientProps {
  user: ProfileUser;
  postCount: number;
  commentCount: number;
}

export default function ProfileClient({ user, postCount, commentCount }: ProfileClientProps) {
  const joinDate = new Date(user.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const menuItems = [
    { icon: Bell, label: "알림 설정", href: "/profile/notifications" },
    { icon: Shield, label: "개인정보 관리", href: "/profile/privacy" },
    { icon: HelpCircle, label: "고객센터", href: "/polls/help" },
  ];

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
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "프로필"}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{user.name ?? "사용자"}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">가입일: {joinDate}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold text-foreground">{postCount}</p>
              <p className="text-[10px] text-muted-foreground">게시글</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold text-foreground">{commentCount}</p>
              <p className="text-[10px] text-muted-foreground">댓글</p>
            </div>
          </div>
        </div>

        {/* Placeholder for activity */}
        <div className="px-4 py-6">
          <p className="text-sm text-muted-foreground text-center">활동 내역은 준비중입니다</p>
        </div>

        {/* Menu */}
        <div className="border-t border-border">
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
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </div>
    </>
  );
}
