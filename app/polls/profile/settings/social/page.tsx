"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialAccount {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  email?: string;
}

export default function SocialSettingsPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    {
      id: "kakao",
      name: "카카오",
      icon: "K",
      color: "#FEE500",
      connected: true,
      email: "user@kakao.com",
    },
    { id: "naver", name: "네이버", icon: "N", color: "#03C75A", connected: false },
    { id: "google", name: "Google", icon: "G", color: "#4285F4", connected: false },
  ]);

  const handleToggle = (id: string) => {
    setAccounts(
      accounts.map((acc) => {
        if (acc.id === id) {
          if (acc.connected) {
            // 연결 해제 확인
            if (confirm(`${acc.name} 계정 연결을 해제하시겠습니까?`)) {
              return { ...acc, connected: false, email: undefined };
            }
          } else {
            // TODO: OAuth 연동 로직
            return { ...acc, connected: true, email: `user@${acc.id}.com` };
          }
        }
        return acc;
      })
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/polls/profile/settings"
            className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="font-bold text-foreground">소셜 계정 연동</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4">
        <p className="text-sm text-muted-foreground mb-4">
          소셜 계정을 연동하면 해당 계정으로 간편하게 로그인할 수 있습니다.
        </p>

        <div className="space-y-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 bg-card border border-border rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: account.color,
                    color: account.id === "kakao" ? "#000" : "#fff",
                  }}
                >
                  {account.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{account.name}</p>
                  {account.connected && account.email && (
                    <p className="text-[11px] text-muted-foreground">{account.email}</p>
                  )}
                </div>
              </div>
              <Button
                variant={account.connected ? "outline" : "default"}
                size="sm"
                onClick={() => handleToggle(account.id)}
                className={account.connected ? "gap-1.5 bg-transparent" : "gap-1.5"}
              >
                {account.connected ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    연결됨
                  </>
                ) : (
                  "연결하기"
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-xl">
          <p className="text-xs text-muted-foreground">
            소셜 계정 연동 시 해당 서비스의 이용약관 및 개인정보처리방침에 동의하게 됩니다. 연동을
            해제해도 기존 활동 기록은 유지됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
