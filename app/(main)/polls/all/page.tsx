"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Search,
  Users,
  ListChecks,
  Sliders,
  Trophy,
  ThumbsUp,
  TrendingUp,
  CheckSquare,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PollType } from "@/components/polls/types/poll-types";

type SortType = "popular" | "recent" | "ending_soon";

interface Poll {
  id: string;
  title: string;
  category: string;
  image: string;
  totalVotes: number;
  endDate: string;
  pollType: PollType;
}

const pollTypeLabels: Record<PollType, { label: string; icon: typeof ListChecks }> = {
  binary: { label: "양자택일", icon: CheckSquare },
  multiple: { label: "다지선다", icon: ListChecks },
  checkbox: { label: "복수선택", icon: CheckSquare },
  scale: { label: "척도", icon: Sliders },
  ranking: { label: "순위", icon: Trophy },
  yesno: { label: "찬반", icon: ThumbsUp },
  prediction: { label: "예측", icon: TrendingUp },
};

const categoryFilters = ["전체", "정치", "경제", "사회", "IT/기술", "문화", "스포츠"];

// 첫 페이지: 실제 샘플 데이터와 연결된 여론조사
const featuredPolls: Poll[] = [
  {
    id: "1",
    title: "AI 딥페이크 규제, 표현의 자유 vs 피해자 보호 어느 쪽이 우선일까요?",
    category: "IT/기술",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=200&fit=crop",
    totalVotes: 89420,
    endDate: "03.15",
    pollType: "binary",
  },
  {
    id: "2",
    title: "2026년 대선에서 가장 중요하게 다뤄져야 할 이슈는?",
    category: "정치",
    image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=200&h=200&fit=crop",
    totalVotes: 156780,
    endDate: "04.01",
    pollType: "multiple",
  },
  {
    id: "3",
    title: "재택근무의 장점이라고 생각되는 것을 모두 선택해주세요",
    category: "사회",
    image: "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=200&h=200&fit=crop",
    totalVotes: 45230,
    endDate: "03.20",
    pollType: "checkbox",
  },
  {
    id: "4",
    title: "현 정부의 경제 정책 만족도를 1~10점으로 평가해주세요",
    category: "경제",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=200&fit=crop",
    totalVotes: 78340,
    endDate: "03.25",
    pollType: "scale",
  },
  {
    id: "5",
    title: "살기 좋은 도시 1~5위를 선정해주세요",
    category: "사회",
    image: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=200&h=200&fit=crop",
    totalVotes: 62150,
    endDate: "03.30",
    pollType: "ranking",
  },
  {
    id: "6",
    title: "주 4일제 전면 도입에 찬성하십니까?",
    category: "사회",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=200&h=200&fit=crop",
    totalVotes: 234560,
    endDate: "04.10",
    pollType: "yesno",
  },
  {
    id: "7",
    title: "2026 월드컵 결승전 승리팀을 예측해주세요",
    category: "스포츠",
    image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=200&h=200&fit=crop",
    totalVotes: 189450,
    endDate: "07.19",
    pollType: "prediction",
  },
];

// Mock data generator for additional pages
const generatePolls = (page: number): Poll[] => {
  if (page === 1) return featuredPolls;

  const categories = ["정치", "경제", "사회", "IT/기술", "문화", "스포츠"];
  const pollTypes: PollType[] = [
    "binary",
    "multiple",
    "checkbox",
    "scale",
    "ranking",
    "yesno",
    "prediction",
  ];
  const images = [
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=200&fit=crop",
  ];
  const titles = [
    "2026년 대선 후보 지지율 조사",
    "AI 규제 법안에 대한 여론",
    "주 4일제 도입 찬반 조사",
    "부동산 정책 만족도 조사",
    "교육 개혁안에 대한 의견",
    "환경 정책 우선순위 조사",
    "2026 월드컵 결승 예측",
  ];

  return Array.from({ length: 10 }, (_, i) => ({
    id: `poll-${page}-${i}`,
    title: titles[i % titles.length],
    category: categories[i % categories.length],
    image: images[i % images.length],
    totalVotes: Math.floor(Math.random() * 500000) + 10000,
    endDate: `03.${String(10 + page + i).padStart(2, "0")}`,
    pollType: pollTypes[i % pollTypes.length],
  }));
};

export default function PollsAllPage() {
  const [sortType, setSortType] = useState<SortType>("popular");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [polls, setPolls] = useState<Poll[]>(() => generatePolls(1));
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
      const newPolls = generatePolls(page + 1);
      if (page >= 5) {
        setHasMore(false);
      } else {
        setPolls((prev) => [...prev, ...newPolls]);
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
    { value: "popular", label: "인기순" },
    { value: "recent", label: "최신순" },
    { value: "ending_soon", label: "마감임박" },
  ];

  const filteredPolls = polls
    .filter((poll) => poll.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((poll) => categoryFilter === "전체" || poll.category === categoryFilter);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/polls"
            className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="font-bold text-foreground">전체 여론조사</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="여론조사 검색..."
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

        {/* Poll List */}
        <div className="space-y-2">
          {filteredPolls.map((poll) => (
            <Link
              key={poll.id}
              href={`/polls/${poll.id}`}
              className="block w-full bg-card border border-border rounded-xl p-3 hover:shadow-md transition-all duration-200 hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  <Image
                    src={poll.image || "/placeholder.svg"}
                    alt={poll.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {poll.category}
                    </span>
                    {(() => {
                      const typeInfo = pollTypeLabels[poll.pollType];
                      const Icon = typeInfo.icon;
                      return (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          <Icon className="w-2.5 h-2.5" />
                          {typeInfo.label}
                        </span>
                      );
                    })()}
                  </div>
                  <h3 className="font-medium text-foreground text-sm mt-1 line-clamp-2 leading-snug">
                    {poll.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className="text-[11px]">{poll.totalVotes.toLocaleString()}명</span>
                    </div>
                    <span className="text-[11px]">~{poll.endDate}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {loading && (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
          {!hasMore && (
            <p className="text-sm text-muted-foreground">모든 여론조사를 불러왔습니다</p>
          )}
        </div>
      </main>
    </div>
  );
}
