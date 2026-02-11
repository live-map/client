"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Search, ThumbsUp, MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type SortType = "popular" | "recent";

interface Suggestion {
  id: string;
  title: string;
  category: string;
  author: string;
  likes: number;
  comments: number;
  createdAt: string;
}

const categoryFilters = ["전체", "정치", "경제", "사회", "IT/기술", "문화", "스포츠"];

// Mock data generator
const generateSuggestions = (page: number): Suggestion[] => {
  const items = [
    { title: "국가위기관리단 신설, 어떻게 생각하시나요?", category: "정치" },
    { title: "공무원 정년 연장에 대한 찬반 의견이 궁금합니다", category: "사회" },
    { title: "주 4일제 도입, 현실적으로 가능할까요?", category: "경제" },
    { title: "대학 등록금 동결 정책에 대한 의견", category: "사회" },
    { title: "청년 주거 정책 개선 방안", category: "경제" },
    { title: "의료 민영화에 대한 찬반", category: "사회" },
    { title: "AI 규제 법안 필요성에 대해", category: "IT/기술" },
    { title: "K-POP 해외 진출 지원 정책", category: "문화" },
    { title: "프로야구 시즌 확대 논의", category: "스포츠" },
    { title: "스타트업 지원 정책 효과", category: "경제" },
  ];
  const authors = ["익명의사용자", "투표마니아", "정치관심러", "민주시민", "여론왕"];

  return Array.from({ length: 10 }, (_, i) => ({
    id: `suggestion-${page}-${i}`,
    title: items[i % items.length].title,
    category: items[i % items.length].category,
    author: authors[i % authors.length],
    likes: Math.floor(Math.random() * 3000) + 100,
    comments: Math.floor(Math.random() * 500) + 10,
    createdAt: `${Math.floor(Math.random() * 24) + 1}시간 전`,
  }));
};

export default function SuggestionsPage() {
  const [sortType, setSortType] = useState<SortType>("popular");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => generateSuggestions(1));
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Load more function
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);
    setTimeout(() => {
      const newSuggestions = generateSuggestions(page + 1);
      if (page >= 5) {
        setHasMore(false);
      } else {
        setSuggestions((prev) => [...prev, ...newSuggestions]);
        setPage((prev) => prev + 1);
      }
      setLoading(false);
    }, 500);
  }, [loading, hasMore, page]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, loadMore]);

  const sortOptions: { value: SortType; label: string }[] = [
    { value: "popular", label: "추천순" },
    { value: "recent", label: "최신순" },
  ];

  const filteredSuggestions = suggestions
    .filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((s) => categoryFilter === "전체" || s.category === categoryFilter);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/polls"
              className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="font-bold text-foreground">여론조사 제안</h1>
          </div>
          <Button size="sm" className="gap-1 h-8 text-xs" asChild>
            <Link href="/polls/suggest/new">
              <Plus className="w-3.5 h-3.5" />
              제안하기
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="제안 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Sort & Filter */}
        <div className="space-y-2 mb-4">
          {/* Sort Tabs */}
          <div className="flex gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSortType(option.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  sortType === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {categoryFilters.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setCategoryFilter(category)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                  categoryFilter === category
                    ? "bg-foreground/10 text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground">
            추천을 많이 받은 제안은 공식 여론조사로 등록됩니다
          </p>
        </div>

        {/* Suggestion List */}
        <div className="space-y-2">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              className="w-full bg-card border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-start gap-2">
                <span className="text-muted-foreground font-medium text-xs min-w-[20px]">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2">{suggestion.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span>{suggestion.author}</span>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{suggestion.likes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      <span>{suggestion.comments}</span>
                    </div>
                    <span>{suggestion.createdAt}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {loading && (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
          {!hasMore && <p className="text-sm text-muted-foreground">모든 제안을 불러왔습니다</p>}
        </div>
      </main>
    </div>
  );
}
