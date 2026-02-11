import Link from "next/link";
import { Flag, ChevronRight } from "lucide-react";

export function HomeHero() {
  return (
    <section className="px-4 pt-4 pb-2">
      <Link href="/polls/about" className="inline-flex items-center gap-1.5 mb-1.5 group">
        <Flag className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
          어떻게 투명성을 보장하나요?
        </span>
        <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </Link>
      <h1 className="text-base font-bold text-foreground leading-snug">
        투명한 대한민국을
        <br />
        클릭 한번으로 만들어보세요
      </h1>
      <p className="text-[11px] text-muted-foreground mt-1.5">1인 1투표 · 국적표시 · 실시간 검증</p>
    </section>
  );
}
