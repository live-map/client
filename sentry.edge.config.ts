// This file configures the initialization of Sentry for edge features.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable logs
  enableLogs: true,

  // Enable sending user PII
  sendDefaultPii: true,
});
