import { NextRequest, NextResponse } from "next/server";

// FastAPI 백엔드 주소
const API_BASE = process.env.API_URL || "http://localhost:8000";
// 프론트엔드 주소 (리다이렉트용)
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
// 프로덕션에서는 __Secure- 접두사 사용 (HTTPS 필수 쿠키)
const ACCESS_COOKIE =
  process.env.NODE_ENV === "production" ? "__Secure-grapoll-access-token" : "grapoll-access-token";
const REFRESH_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-grapoll-refresh-token"
    : "grapoll-refresh-token";

/**
 * OAuth 콜백 핸들러
 *
 * OAuth 제공자(Google/Kakao)가 인증 완료 후 authorization code와 함께
 * 이 URL로 리다이렉트함. 예: /api/auth/callback/google?code=xxx&state=yyy
 *
 * 이 핸들러는 code를 백엔드에 전달하고, 백엔드가 발급한 토큰을
 * httpOnly 쿠키에 저장하는 역할만 함 (토큰 생성/검증은 백엔드가 담당)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  // URL에서 provider 추출 (e.g. "google", "kakao")
  const { provider } = await params;
  const searchParams = request.nextUrl.searchParams;

  // OAuth 제공자가 리다이렉트할 때 붙여주는 authorization code와 state
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // 로그인 전에 사용자가 있던 페이지 (signInWithOAuth에서 쿠키에 저장해둠)
  const callbackUrl = request.cookies.get("auth-callback-url")?.value || "/";

  // authorization code가 없으면 OAuth 흐름이 실패한 것
  if (!code) {
    return NextResponse.redirect(new URL("/auth/signin?error=no_code", FRONTEND_URL));
  }

  // 백엔드에 전달할 redirect_uri (OAuth 제공자에 등록된 URI와 정확히 일치해야 함)
  const redirectUri = `${FRONTEND_URL}/api/auth/callback/${provider}`;

  try {
    // 백엔드에 authorization code 전달
    // 백엔드가 이 code로 OAuth 제공자에서 사용자 정보를 가져오고,
    // DB에 유저를 생성/조회한 뒤, access_token(JWT)과 refresh_token을 발급함
    const res = await fetch(`${API_BASE}/api/v1/auth/oauth/${provider}/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code, // OAuth authorization code
        state, // CSRF 방지용 state 값
        redirect_uri: redirectUri, // 백엔드가 OAuth 제공자에 토큰 요청 시 필요
      }),
    });

    // 백엔드에서 인증 실패 (잘못된 code, 만료된 code 등)
    if (!res.ok) {
      return NextResponse.redirect(new URL("/auth/signin?error=auth_failed", FRONTEND_URL));
    }

    // 백엔드 응답: { access_token: "jwt...", refresh_token: "opaque..." }
    const data = await res.json();

    // 로그인 전 페이지로 리다이렉트 (e.g. "/", "/polls/123")
    const response = NextResponse.redirect(new URL(callbackUrl, FRONTEND_URL));

    // 로그인 완료했으므로 임시 callbackUrl 쿠키 삭제
    response.cookies.delete("auth-callback-url");

    // 백엔드가 발급한 access token을 httpOnly 쿠키에 저장 (30분)
    // httpOnly: JS에서 접근 불가 (XSS 방어)
    // sameSite: "lax": CSRF 방어하면서 OAuth 리다이렉트는 허용
    response.cookies.set(ACCESS_COOKIE, data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 60, // 30분
    });

    // 백엔드가 발급한 refresh token을 httpOnly 쿠키에 저장 (30일)
    // access token 만료 시 이 토큰으로 새 access token 발급받음
    response.cookies.set(REFRESH_COOKIE, data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30일
    });

    return response;
  } catch {
    // 네트워크 오류 등 예외 발생 시
    return NextResponse.redirect(new URL("/auth/signin?error=server_error", FRONTEND_URL));
  }
}
