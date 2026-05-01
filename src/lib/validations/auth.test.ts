import { describe, expect, it } from 'vitest';

import { registerSchema } from './auth';

describe('registerSchema', () => {
  it('accepts a valid payload', () => {
    expect(
      registerSchema.safeParse({
        email: 'user@example.com',
        password: 'secret123',
        name: 'Ada',
      }).success,
    ).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'secret123',
    });
    expect(r.success).toBe(false);
  });

  it('rejects short password', () => {
    const r = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });
    expect(r.success).toBe(false);
  });

  it('allows missing optional name', () => {
    const r = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBeUndefined();
  });
});
