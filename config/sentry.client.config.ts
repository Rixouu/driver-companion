// This file configures the initialization of Sentry in the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://5373d90d5724d5df2a06d11ddece071a@o4509383866646528.ingest.us.sentry.io/4509383866843136",

  // Define how likely traces are sampled.
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // replaysOnErrorSampleRate: 1.0, This is for Session Replay, not strictly performance monitoring.
  // replaysSessionSampleRate: 0.1, This is for Session Replay.

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  // integrations: [
  //   Sentry.replayIntegration({
  //     // Additional Replay configuration goes in here, for example:
  //     maskAllText: true,
  //     blockAllMedia: true,
  //   }),
  // ],
}); 