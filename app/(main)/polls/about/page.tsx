import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  Eye,
  Bot,
  CheckCircle2,
  Users,
  BarChart3,
  Lock,
  Globe,
  Fingerprint,
  FileCheck,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/polls"
            className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="font-bold text-foreground">투명한 대한민국</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {/* Hero */}
        <section className="px-4 py-12 text-center border-b border-border">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full mb-6">
            <BarChart3 className="w-3.5 h-3.5" />
            2024 로이터 디지털 뉴스 리포트
          </div>

          <h1 className="text-3xl font-bold text-foreground leading-tight mb-4">
            <span className="text-primary">31%</span>만이
            <br />
            뉴스를 믿는 나라
          </h1>

          <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
            10명 중 7명이 뉴스를 믿지 않는 대한민국.
            <br />
            우리는 무엇을 기준으로 판단해야 할까요?
          </p>
        </section>

        {/* Problem */}
        <section className="px-4 py-10 border-b border-border">
          <h2 className="text-lg font-bold text-foreground mb-6">문제</h2>

          <div className="space-y-4">
            {/* Card 1 */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">전 세계 최하위 언론 신뢰도</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    한국의 언론 신뢰도는 31%로, 조사 대상 46개국 중 최하위권입니다. 같은 조사에서
                    핀란드는 69%, 일본은 44%를 기록했습니다.
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-2">
                    출처: Reuters Institute Digital News Report 2024
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">구조화된 가짜뉴스 확산</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    한국의 가짜뉴스는 개인이 아닌, 공식 언론사에서 시작되어 정치권과 다른 미디어가
                    증폭시키는 구조적 특성을 보입니다. 단순 삭제로 해결되지 않습니다.
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 mt-2">
                    출처: East Asia Institute Conference 2024
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Quote className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">감정에 의한 판단</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    자극적인 헤드라인, 편향된 해석, 맥락 없는 정보. 우리는 사실이 아닌 감정으로
                    판단하도록 유도받고 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solution - Transparency */}
        <section className="px-4 py-10 border-b border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">투명성</h2>
              <p className="text-sm text-muted-foreground">1인 1투표, 실제 한국인만</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
              <Fingerprint className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">기기 고유 식별</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Device Fingerprinting으로 동일 기기 복수 계정을 감지합니다. 쿠키 삭제, 시크릿
                  모드, VPN을 사용해도 추적됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
              <Globe className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">한국 IP 검증</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  VPN/프록시 탐지 기술로 실제 한국 접속만 허용합니다. 투표에 &quot;대한민국&quot;
                  국적이 표시되어 신뢰성을 부여합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
              <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">영지식 증명 (ZKP)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  개인정보 노출 없이 &quot;한국 성인&quot;임만 증명합니다. 프라이버시 보호와 1인
                  1표를 동시에 달성하는 암호학 기술입니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
              <FileCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">투표 검증 시스템</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  투표 후 개인 검증 키가 발급됩니다. 본인 투표가 실제로 집계에 반영되었는지 언제든
                  확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution - Objectivity */}
        <section className="px-4 py-10 border-b border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">객관성</h2>
              <p className="text-sm text-muted-foreground">AI는 판단하지 않습니다</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 mb-4">
            <p className="text-sm text-foreground leading-relaxed mb-4">
              우리의 AI는{" "}
              <span className="font-semibold text-primary">&quot;이것이 옳다&quot;</span>
              고 말하지 않습니다.
              <br />
              대신 <span className="font-semibold">&quot;이런 자료들이 있습니다&quot;</span>라고
              보여줍니다.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>- 통계청, 연구기관의 공식 데이터</p>
              <p>- 해당 분야 전문가들의 발언 (원문 그대로)</p>
              <p>- 찬성/반대 양측의 근거 균형있게 제시</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
              <Eye className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">복수 출처 원칙</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  단일 매체가 아닌 다양한 출처에서 정보를 수집합니다. 좌/우 성향 매체를 균형있게
                  참조하여 편향을 방지합니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">투명한 출처 표시</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  모든 정보에 원본 링크가 필수입니다. &quot;이 정보는 OOO에서 가져왔습니다&quot;가
                  항상 명시됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl">
              <BarChart3 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Factcheck-Bench 구조</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  주장(Claim) → 근거(Evidence) → 판정은 사용자가. AI가 결론을 내리지 않고, 판단
                  재료만 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="px-4 py-10 border-b border-border">
          <h2 className="text-lg font-bold text-foreground mb-2">기술 신뢰</h2>
          <p className="text-sm text-muted-foreground mb-6">
            &quot;믿어주세요&quot;가 아닌, &quot;검증해보세요&quot;
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Lock className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-xs font-medium text-foreground">알고리즘 공개</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">검열 의혹 방지</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-xs font-medium text-foreground">커뮤니티 감사</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">편향 여부 검증</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FileCheck className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-xs font-medium text-foreground">투표 추적 불가</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">완전한 익명성</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Shield className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-xs font-medium text-foreground">조작 불가능</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">암호학적 보장</p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="px-4 py-10 border-b border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">왜 만들었나</h2>

          <div className="bg-muted/30 rounded-2xl p-5">
            <p className="text-sm text-foreground/90 leading-relaxed">
              뉴스를 보면서 &quot;이게 진짜일까?&quot;라는 의문이 들 때가 많았습니다.
              <br />
              <br />
              같은 사건도 매체마다 완전히 다른 해석. 댓글창은 서로를 향한 비난으로 가득하고. 진실이
              뭔지 알 수 없는 채로 그냥 지나가는 일들.
              <br />
              <br />
              <span className="font-medium text-foreground">
                &quot;객관적인 자료만 보고 직접 판단할 수 있다면?&quot;
              </span>
              <br />
              <br />
              그 단순한 질문에서 시작했습니다.
              <br />
              <br />
              언론도, 정치인도, AI도 대신 판단해주지 않는 곳. 오직 사실만 제공되고, 결론은 당신이
              내리는 곳.
              <br />
              <br />
              투명한 대한민국은 그런 공간을 만들고 싶습니다.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-12 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">
            투명한 대한민국,
            <br />
            함께 만들어요
          </h2>
          <p className="text-sm text-muted-foreground mb-6">당신의 한 표가 진짜 여론이 됩니다</p>

          <Link href="/polls">
            <Button size="lg" className="gap-2">
              지금 참여하기
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </section>
      </main>
    </div>
  );
}
