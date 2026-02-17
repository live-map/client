// This file configures the initialization of Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable logs
  enableLogs: true,

  // Enable sending user PII
  sendDefaultPii: true,

  // Debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Replay settings
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  // Session Replay integration
  integrations: Sentry.replayIntegration
    ? [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ]
    : [],
});

// Export router transition tracking for Next.js App Router
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
