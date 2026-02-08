"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-muted-foreground/20 mb-4">404</div>
        <h1 className="text-xl font-bold text-foreground mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-muted-foreground mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </Button>
          <Link href="/polls">
            <Button className="gap-2">
              <Home className="w-4 h-4" />
              홈으로
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
