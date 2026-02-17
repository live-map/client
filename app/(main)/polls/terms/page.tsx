import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          <h1 className="font-bold text-foreground">이용약관</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-sm mb-6">최종 수정일: 2026년 2월 1일</p>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제1조 (목적)</h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              이 약관은 투명한 대한민국(이하 &quot;서비스&quot;)이 제공하는 여론조사 플랫폼 서비스의
              이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제2조 (정의)</h2>
            <ul className="text-sm text-foreground/80 space-y-2 list-disc pl-4">
              <li>
                &quot;서비스&quot;란 회사가 제공하는 여론조사 참여, 의견 공유, 커뮤니티 기능 등을
                의미합니다.
              </li>
              <li>&quot;회원&quot;이란 서비스에 가입하여 이용하는 자를 말합니다.</li>
              <li>&quot;비회원&quot;이란 회원가입 없이 서비스를 이용하는 자를 말합니다.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제3조 (서비스 이용)</h2>
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">
              서비스는 다음과 같은 기능을 제공합니다:
            </p>
            <ul className="text-sm text-foreground/80 space-y-2 list-disc pl-4">
              <li>다양한 주제에 대한 여론조사 참여</li>
              <li>AI 기반 팩트체크 정보 제공</li>
              <li>의견 공유 및 토론</li>
              <li>여론조사 제안</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제4조 (회원의 의무)</h2>
            <ul className="text-sm text-foreground/80 space-y-2 list-disc pl-4">
              <li>타인의 명예를 훼손하거나 불이익을 주는 행위 금지</li>
              <li>허위 정보 유포 금지</li>
              <li>서비스 운영을 방해하는 행위 금지</li>
              <li>법령 및 본 약관을 준수</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제5조 (서비스 제한)</h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              회사는 회원이 본 약관을 위반하거나 서비스의 정상적인 운영을 방해한 경우, 서비스 이용을
              제한하거나 회원자격을 상실시킬 수 있습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">제6조 (면책조항)</h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              서비스에서 제공하는 여론조사 결과 및 AI 분석 정보는 참고용이며, 이를 바탕으로 한
              결정에 대해 회사는 책임지지 않습니다.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
