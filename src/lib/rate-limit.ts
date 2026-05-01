import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

export type AiRateBucket = 'ask' | 'search' | 'summary' | 'enrich';
const CONFIG: Record<AiRateBucket, { max: number; windowSec: number }> = {
  ask: {
    max: numEnv('RATE_LIMIT_ASK_MAX', 30),
    windowSec: numEnv('RATE_LIMIT_ASK_WINDOW_SEC', 3600),
  },
  search: {
    max: numEnv('RATE_LIMIT_SEARCH_MAX', 120),
    windowSec: numEnv('RATE_LIMIT_SEARCH_WINDOW_SEC', 3600),
  },
  summary: {
    max: numEnv('RATE_LIMIT_SUMMARY_MAX', 60),
    windowSec: numEnv('RATE_LIMIT_SUMMARY_WINDOW_SEC', 3600),
  },
  enrich: {
    max: numEnv('RATE_LIMIT_ENRICH_MAX', 100),
    windowSec: numEnv('RATE_LIMIT_ENRICH_WINDOW_SEC', 3600),
  },
};

function numEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function getRedis(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

function secondsUntilWindowEnd(windowSec: number): number {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSec) * windowSec;
  return Math.max(1, windowStart + windowSec - now);
}

export type ConsumeResult =
  | { allowed: true; remaining: number; limit: number }
  | { allowed: false; limit: number; retryAfterSec: number };

/**
 * Fixed-window limit per user and bucket. Without Upstash env, allows all (local dev).
 */
export async function consumeUserRateLimit(
  userId: string,
  bucket: AiRateBucket
): Promise<ConsumeResult> {
  const { max, windowSec } = CONFIG[bucket];
  const redis = getRedis();
  if (!redis) {
    return { allowed: true, remaining: max, limit: max };
  }
  const windowIndex = Math.floor(Date.now() / 1000 / windowSec);
  const key = `rl:smart-notes:${bucket}:${userId}:${windowIndex}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSec);
  }
  if (count > max) {
    return {
      allowed: false,
      limit: max,
      retryAfterSec: secondsUntilWindowEnd(windowSec),
    };
  }
  return {
    allowed: true,
    remaining: Math.max(0, max - count),
    limit: max,
  };
}

export function rateLimitHeaders(
  result: Extract<ConsumeResult, { allowed: true }>
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
  };
}

export function tooManyRequestsResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
      },
    }
  );
}
