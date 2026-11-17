import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { envSchema } from './env.js';

const settings = {
  ADMIN_USERNAME: 'test-admin',
  ADMIN_PASSWORD_HASH: `scrypt-v1$32768$8$3$${'a'.repeat(32)}$${'b'.repeat(128)}`,
  ADMIN_SESSION_SECRET: randomBytes(32).toString('hex'),
  CV_SIGNING_SECRET: randomBytes(32).toString('hex'),
};
describe('admin startup configuration', () => {
  it('permits existing public deployments with admin disabled', () => {
    expect(envSchema.safeParse({}).success).toBe(true);
    expect(envSchema.safeParse({ CV_SIGNING_SECRET: settings.CV_SIGNING_SECRET }).success).toBe(
      true,
    );
  });
  it('accepts complete private configuration and requires HTTPS in production', () => {
    expect(envSchema.safeParse(settings).success).toBe(true);
    expect(envSchema.safeParse({ ...settings, NODE_ENV: 'production' }).success).toBe(false);
    expect(
      envSchema.safeParse({
        ...settings,
        NODE_ENV: 'production',
        CLIENT_URL: 'https://example.invalid',
      }).success,
    ).toBe(true);
  });
  it('rejects partial config, plaintext passwords, weak keys and shared keys', () => {
    for (const config of [
      { ADMIN_USERNAME: 'test-admin' },
      { ...settings, ADMIN_PASSWORD_HASH: 'plaintext' },
      { ...settings, ADMIN_SESSION_SECRET: 'weak' },
      { ...settings, ADMIN_SESSION_SECRET: settings.CV_SIGNING_SECRET },
      { ...settings, CV_SIGNING_SECRET: undefined },
    ])
      expect(envSchema.safeParse(config).success).toBe(false);
  });
});
