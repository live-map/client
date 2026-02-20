import Link from "next/link";
import { Sparkles, Search, FileCheck, FileText, ChevronRight } from "lucide-react";

const STEPS = [
  { icon: Search, label: "출처 수집" },
  { icon: FileCheck, label: "팩트 분석" },
  { icon: FileText, label: "리포트 생성" },
] as const;

export function HomeHero() {
  return (
    <section className="px-4 pt-3 pb-1">
      <Link href="/polls/suggest/new" className="block">
        <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-primary via-accent to-primary overflow-hidden">
          <div className="relative rounded-[11px] bg-card px-4 py-3 overflow-hidden">
            {/* Decorative bg */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/8 blur-2xl" />

            {/* Top row: badge + copy */}
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 mb-1.5">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-semibold text-primary">AI Research Agent</span>
                </div>
                <h2 className="text-sm font-bold text-foreground leading-snug">
                  여론조사를 만들면 <span className="text-primary">AI가 팩트를 조사</span>해드립니다
                </h2>
              </div>
              <div className="flex-shrink-0 mt-1 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-primary" />
              </div>
            </div>

            {/* Bottom row: 3 steps inline */}
            <div className="relative flex items-center gap-1.5 mt-2.5">
              {STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60">
                    <step.icon className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && <div className="w-3 h-px bg-border" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
