/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  consumeUserRateLimit,
  rateLimitHeaders,
  tooManyRequestsResponse,
} from './rate-limit';

describe('rateLimitHeaders', () => {
  it('formats limit headers', () => {
    expect(
      rateLimitHeaders({ allowed: true, remaining: 5, limit: 10 }),
    ).toEqual({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '5',
    });
  });
});

describe('tooManyRequestsResponse', () => {
  it('returns 429 with Retry-After', async () => {
    const res = tooManyRequestsResponse(42);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('42');
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });
});

describe('consumeUserRateLimit without Upstash env', () => {
  let url: string | undefined;
  let token: string | undefined;

  beforeEach(() => {
    url = process.env.KV_REST_API_URL;
    token = process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  afterEach(() => {
    if (url === undefined) delete process.env.KV_REST_API_URL;
    else process.env.KV_REST_API_URL = url;
    if (token === undefined) delete process.env.KV_REST_API_TOKEN;
    else process.env.KV_REST_API_TOKEN = token;
  });

  it('allows the request when Redis is not configured', async () => {
    const result = await consumeUserRateLimit('test-user-id', 'ask');
    expect(result).toMatchObject({
      allowed: true,
      limit: expect.any(Number),
      remaining: expect.any(Number),
    });
    expect(result).toHaveProperty('allowed', true);
  });
});
