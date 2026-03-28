"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { context: "polls_error_boundary" } });
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">문제가 발생했습니다</h1>
        <p className="text-sm text-muted-foreground mb-8">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={reset} className="gap-2 bg-transparent">
            <RefreshCw className="w-4 h-4" />
            다시 시도
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
