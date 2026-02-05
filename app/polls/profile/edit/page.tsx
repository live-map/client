"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const interestOptions = ["정치", "경제", "사회", "IT/기술", "문화", "스포츠", "환경", "교육"];

export default function ProfileEditPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("투명한시민");
  const [bio, setBio] = useState("투명한 대한민국을 만들어가는 시민입니다.");
  const [interests, setInterests] = useState(["정치", "경제", "사회"]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInterestToggle = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else if (interests.length < 5) {
      setInterests([...interests, interest]);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    // TODO: API 호출
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    router.push("/polls/profile");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/polls/profile"
              className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="font-bold text-foreground">프로필 수정</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 프로필 이미지 */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
              투
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 닉네임 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            placeholder="닉네임을 입력하세요"
          />
          <p className="text-xs text-muted-foreground mt-1.5">{nickname.length}/20</p>
        </div>

        {/* 소개 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">소개</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={100}
            rows={3}
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
            placeholder="자신을 소개해주세요"
          />
          <p className="text-xs text-muted-foreground mt-1.5">{bio.length}/100</p>
        </div>

        {/* 관심 분야 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            관심 분야 <span className="text-muted-foreground font-normal">(최대 5개)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((interest) => (
              <button
                key={interest}
                type="button"
                onClick={() => handleInterestToggle(interest)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  interests.includes(interest)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {interest}
                {interests.includes(interest) && <X className="w-3 h-3 ml-1 inline" />}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* 저장 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-lg mx-auto px-4 py-3">
          <Button className="w-full" onClick={handleSave} disabled={isLoading || !nickname.trim()}>
            {isLoading ? "저장 중..." : "저장하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
