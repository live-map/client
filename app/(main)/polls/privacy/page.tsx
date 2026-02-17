import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className="font-bold text-foreground">개인정보처리방침</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-sm mb-6">최종 수정일: 2026년 2월 1일</p>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">1. 수집하는 개인정보</h2>
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">
              서비스 이용을 위해 다음 정보를 수집합니다:
            </p>
            <ul className="text-sm text-foreground/80 space-y-2 list-disc pl-4">
              <li>필수: 이메일 주소, 비밀번호, 닉네임</li>
              <li>선택: 프로필 이미지, 관심 분야</li>
              <li>자동 수집: 기기 정보, 접속 기록, 쿠키</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">2. 개인정보 이용 목적</h2>
            <ul className="text-sm text-foreground/80 space-y-2 list-disc pl-4">
              <li>회원 식별 및 서비스 제공</li>
              <li>여론조사 결과 통계 분석 (비식별 처리)</li>
              <li>서비스 개선 및 신규 기능 개발</li>
              <li>부정 이용 방지</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">3. 개인정보 보관 기간</h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              회원 탈퇴 시 즉시 파기하며, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간
              동안 안전하게 보관 후 파기합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">4. 개인정보 제3자 제공</h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의한 요청이 있는 경우
              예외로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">5. 이용자의 권리</h2>
            <ul className="text-sm text-foreground/80 space-y-2 list-disc pl-4">
              <li>개인정보 열람, 정정, 삭제 요청</li>
              <li>개인정보 처리 정지 요청</li>
              <li>회원 탈퇴를 통한 개인정보 삭제</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-base font-semibold mb-3">6. 연락처</h2>
            <p className="text-sm text-foreground/80 leading-relaxed">
              개인정보 관련 문의: privacy@transparent.kr
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
