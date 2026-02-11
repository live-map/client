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
