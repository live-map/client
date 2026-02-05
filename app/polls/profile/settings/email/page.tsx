"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailSettingsPage() {
  const router = useRouter();
  const [currentEmail] = useState("user@example.com");
  const [newEmail, setNewEmail] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleSendVerification = () => {
    if (!newEmail) return;
    // TODO: 인증 메일 발송 로직
    setVerificationSent(true);
  };

  const handleSubmit = () => {
    // TODO: 이메일 변경 로직
    alert("이메일이 변경되었습니다.");
    router.push("/polls/profile/settings");
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
          <h1 className="font-bold text-foreground">이메일 변경</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 pb-24">
        <div className="space-y-4">
          {/* 현재 이메일 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">현재 이메일</label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30 border border-border rounded-lg">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{currentEmail}</span>
            </div>
          </div>

          {/* 새 이메일 */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">새 이메일</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 px-3 py-2.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="새 이메일 주소 입력"
                disabled={verificationSent}
              />
              <Button
                variant="outline"
                onClick={handleSendVerification}
                disabled={!newEmail || verificationSent}
                className="bg-transparent whitespace-nowrap"
              >
                {verificationSent ? "발송됨" : "인증"}
              </Button>
            </div>
          </div>

          {/* 인증 코드 */}
          {verificationSent && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">인증 코드</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="이메일로 받은 6자리 코드 입력"
                maxLength={6}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                인증 메일이 발송되었습니다. 3분 내에 입력해주세요.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 p-4">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={!verificationSent || verificationCode.length !== 6}
            className="w-full"
          >
            변경하기
          </Button>
        </div>
      </div>
    </div>
  );
}
