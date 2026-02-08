"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = ["정치", "경제", "사회", "IT/기술", "문화", "스포츠"];

export default function CreateSuggestionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = title.trim().length >= 10 && category && description.trim().length >= 20;

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);

    // TODO: API 호출
    await new Promise((resolve) => setTimeout(resolve, 1000));

    router.push("/polls/suggest");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-lg mx-auto px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/polls/suggest"
              className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <span className="text-[13px] font-medium text-foreground">여론조사 제안하기</span>
          </div>
          <Button
            size="sm"
            disabled={!isValid || isSubmitting}
            onClick={handleSubmit}
            className="h-7 text-xs"
          >
            {isSubmitting ? "제출 중..." : "제출"}
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Info Banner */}
        <div className="flex items-start gap-2 bg-muted/50 border border-border rounded-xl p-3 mb-6">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">제안 가이드</p>
            <ul className="space-y-0.5">
              <li>· 다른 사람들의 의견이 궁금한 주제를 제안해주세요</li>
              <li>· 추천을 많이 받으면 공식 여론조사로 등록됩니다</li>
              <li>· 비방, 혐오 표현은 삭제될 수 있습니다</li>
            </ul>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                    category === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              제목
              <span className="text-muted-foreground font-normal ml-1">(최소 10자)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex) 주 4일제 도입, 현실적으로 가능할까요?"
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              maxLength={100}
            />
            <p className="text-[11px] text-muted-foreground mt-1 text-right">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              설명
              <span className="text-muted-foreground font-normal ml-1">(최소 20자)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 주제에 대해 여론조사가 필요한 이유나 배경을 설명해주세요..."
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
              rows={6}
              maxLength={1000}
            />
            <p className="text-[11px] text-muted-foreground mt-1 text-right">
              {description.length}/1000
            </p>
          </div>
        </div>

        {/* Preview */}
        {title && (
          <div className="mt-8">
            <p className="text-xs font-medium text-muted-foreground mb-2">미리보기</p>
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                {category && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {category}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground font-medium">
                {title || "제목을 입력해주세요"}
              </p>
              {description && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{description}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
