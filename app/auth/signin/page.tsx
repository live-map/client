import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OAuthButton } from "@/components/auth/oauth-button";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>계정에 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <OAuthButton provider="google" />
          <OAuthButton provider="kakao" />
        </CardContent>
      </Card>
    </main>
  );
}
