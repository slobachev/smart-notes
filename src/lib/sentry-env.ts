/**
 * Shared Sentry settings (server, edge, client). DSN only from env.
 */
export function getSentryDsn(): string | undefined {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  return dsn && dsn.length > 0 ? dsn : undefined;
}
export function getSentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    'development'
  );
}
export function getSentryRelease(): string | undefined {
  const r =
    process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA ?? '';
  return r.length > 0 ? r : undefined;
}
/** In dev — full sample; in prod — low by default. */
export function getTracesSampleRate(): number {
  if (process.env.NODE_ENV === 'development') return 1;
  const raw = process.env.SENTRY_TRACES_SAMPLE_RATE;
  if (raw !== undefined && raw !== '') {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.1;
  }
  return 0.1;
}
