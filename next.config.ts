import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React compiler (Next.js 16)
  reactCompiler: true,

  // Experimental features
  experimental: {
    proxyClientMaxBodySize: "3gb", // 대용량 파일 업로드 지원
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google OAuth
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "k.kakaocdn.net", // Kakao OAuth
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Mock poll images
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net", // DALL-E generated
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.ap-northeast-2.amazonaws.com", // S3 uploads
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.khan.co.kr", // 경향신문
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "news.kbs.co.kr", // KBS (http)
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "news.kbs.co.kr", // KBS (https)
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.mk.co.kr", // 매일경제
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.hani.co.kr", // 한겨레
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.joongang.co.kr", // 중앙일보
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "flexible.img.hani.co.kr", // 한겨레 이미지 CDN
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pds.joongang.co.kr", // 중앙일보 이미지
        pathname: "/**",
      },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

const sentryEnabled = !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG || "your-org",
      project: process.env.SENTRY_PROJECT || "your-project",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig;
