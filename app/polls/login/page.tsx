"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const handleSocialLogin = (provider: string) => {
    // TODO: 실제 소셜 로그인 로직
    console.log(`${provider} 로그인 시도`);
    router.push("/polls");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/polls"
            className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="font-bold text-foreground">로그인</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">투명한 대한민국</h2>
          <p className="text-sm text-muted-foreground">소셜 계정으로 간편하게 시작하세요</p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSocialLogin("kakao")}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#FEE500] text-[#000000] text-sm font-medium rounded-xl hover:bg-[#FEE500]/90 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.9 5.34 4.75 6.75-.18.63-.96 3.53-1 3.69-.05.23.09.23.18.17.08-.05 2.85-1.93 4.02-2.72.66.1 1.35.15 2.05.15 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
            </svg>
            카카오로 시작하기
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("naver")}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#03C75A] text-white text-sm font-medium rounded-xl hover:bg-[#03C75A]/90 transition-colors"
          >
            <span className="font-bold text-base">N</span>
            네이버로 시작하기
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-foreground text-sm font-medium rounded-xl border border-border hover:bg-muted/50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            구글로 시작하기
          </button>
        </div>

        {/* Terms Notice */}
        <p className="text-center text-[11px] text-muted-foreground mt-8 leading-relaxed">
          로그인 시{" "}
          <Link href="/polls/terms" className="text-primary hover:underline">
            이용약관
          </Link>{" "}
          및{" "}
          <Link href="/polls/privacy" className="text-primary hover:underline">
            개인정보처리방침
          </Link>
          에<br />
          동의하는 것으로 간주합니다.
        </p>

        {/* Why Social Login */}
        <div className="mt-10 p-4 bg-muted/30 rounded-xl">
          <p className="text-xs text-muted-foreground text-center">
            소셜 로그인을 사용하면 별도의 비밀번호 없이
            <br />
            안전하고 빠르게 서비스를 이용할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
