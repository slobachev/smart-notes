import * as Sentry from '@sentry/nextjs';
import {
  getSentryDsn,
  getSentryEnvironment,
  getSentryRelease,
  getTracesSampleRate,
} from '@/lib/sentry-env';

Sentry.init({
  dsn: getSentryDsn(),
  environment: getSentryEnvironment(),
  release: getSentryRelease(),
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: getTracesSampleRate(),
  enableLogs: process.env.NODE_ENV === 'development',
  replaysSessionSampleRate: process.env.NODE_ENV === 'development' ? 0.2 : 0.05,
  replaysOnErrorSampleRate: 1,
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.request?.data !== undefined) {
      delete event.request.data;
    }
    return event;
  },
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'fetch' && breadcrumb.data) {
      const d = breadcrumb.data as { url?: string; method?: string };
      const url = String(d.url ?? '');
      if (url.includes('/api/')) {
        return {
          ...breadcrumb,
          data: { url, method: d.method },
        };
      }
    }
    return breadcrumb;
  },
});
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
