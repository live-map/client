import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

const protectedPaths = ["/polls/suggest/new", "/profile"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !req.auth) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/polls/suggest/new", "/profile/:path*"],
};
