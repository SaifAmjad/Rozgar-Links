import { describe, expect, it } from 'vitest';

import { healthResponseSchema } from './health.js';

describe('healthResponseSchema', () => {
  it('accepts the public health response', () => {
    expect(healthResponseSchema.parse({ status: 'ok' })).toEqual({ status: 'ok' });
  });

  it('rejects unexpected health states', () => {
    expect(() => healthResponseSchema.parse({ status: 'degraded' })).toThrow();
  });
});
