"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Lock, Eye, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    vote: true,
    comment: true,
    reply: true,
    suggestion: false,
    marketing: false,
  });

  const [privacy, setPrivacy] = useState({
    showActivity: true,
    showVoteHistory: false,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/profile"
            className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="font-bold text-foreground">설정</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* 알림 설정 */}
        <section className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">알림 설정</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">투표 결과 알림</p>
                <p className="text-xs text-muted-foreground">참여한 투표가 마감되면 알림</p>
              </div>
              <Switch
                checked={notifications.vote}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, vote: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">댓글 알림</p>
                <p className="text-xs text-muted-foreground">내 글에 댓글이 달리면 알림</p>
              </div>
              <Switch
                checked={notifications.comment}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, comment: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">답글 알림</p>
                <p className="text-xs text-muted-foreground">내 댓글에 답글이 달리면 알림</p>
              </div>
              <Switch
                checked={notifications.reply}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, reply: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">제안 상태 알림</p>
                <p className="text-xs text-muted-foreground">내 제안 상태가 변경되면 알림</p>
              </div>
              <Switch
                checked={notifications.suggestion}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, suggestion: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">마케팅 알림</p>
                <p className="text-xs text-muted-foreground">이벤트 및 새로운 기능 안내</p>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked: boolean) =>
                  setNotifications({ ...notifications, marketing: checked })
                }
              />
            </div>
          </div>
        </section>

        {/* 공개 설정 */}
        <section className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">공개 설정</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">활동 내역 공개</p>
                <p className="text-xs text-muted-foreground">다른 사용자에게 활동 내역 표시</p>
              </div>
              <Switch
                checked={privacy.showActivity}
                onCheckedChange={(checked: boolean) =>
                  setPrivacy({ ...privacy, showActivity: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">투표 기록 공개</p>
                <p className="text-xs text-muted-foreground">다른 사용자에게 투표 기록 표시</p>
              </div>
              <Switch
                checked={privacy.showVoteHistory}
                onCheckedChange={(checked: boolean) =>
                  setPrivacy({ ...privacy, showVoteHistory: checked })
                }
              />
            </div>
          </div>
        </section>

        {/* 계정 */}
        <section className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">계정</h2>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 -mx-2 px-2 rounded-lg pointer-events-none opacity-50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">비밀번호 변경</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">
                  준비 중
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between py-3 -mx-2 px-2 rounded-lg pointer-events-none opacity-50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">이메일 변경</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">
                  준비 중
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between py-3 -mx-2 px-2 rounded-lg pointer-events-none opacity-50">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">소셜 계정 연동</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full">
                  준비 중
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </section>

        {/* 기타 */}
        <section className="px-4 py-4">
          <div className="space-y-1">
            <Link
              href="/polls/terms"
              className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
            >
              <span className="text-sm text-foreground">이용약관</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            <Link
              href="/polls/privacy"
              className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors"
            >
              <span className="text-sm text-foreground">개인정보처리방침</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>

            <button
              type="button"
              className="flex items-center justify-between py-3 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors w-full text-left"
            >
              <span className="text-sm text-foreground">앱 버전</span>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </button>
          </div>
        </section>

        {/* 회원 탈퇴 */}
        <section className="px-4 py-4 mt-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            회원 탈퇴
          </Button>
        </section>
      </main>
    </div>
  );
}
