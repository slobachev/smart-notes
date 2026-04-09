import * as Sentry from '@sentry/nextjs';
import {
  getSentryDsn,
  getSentryEnvironment,
  getSentryRelease,
  getTracesSampleRate,
} from './src/lib/sentry-env';
Sentry.init({
  dsn: getSentryDsn(),
  environment: getSentryEnvironment(),
  release: getSentryRelease(),
  tracesSampleRate: getTracesSampleRate(),
  enableLogs: process.env.NODE_ENV === 'development',
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.request?.data !== undefined) {
      delete event.request.data;
    }
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  },
});
