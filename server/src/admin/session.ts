import { createHmac, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { constantTimeTextEqual } from './password.js';

export interface AdminConfiguration {
  username: string;
  passwordHash: string;
  sessionSecret: string;
  cvSigningSecret: string;
}
export const adminSessionLifetimeSeconds = 8 * 60 * 60;
const payloadSchema = z
  .object({
    version: z.literal(1),
    purpose: z.literal('rozgar-admin'),
    issuedAt: z.number().int(),
    expiresAt: z.number().int(),
    nonce: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
type SessionPayload = z.infer<typeof payloadSchema>;

function mac(purpose: string, value: string, config: AdminConfiguration) {
  return createHmac('sha256', Buffer.from(config.sessionSecret, 'hex'))
    .update(`rozgar-links/admin/${purpose}/v1\0`)
    .update(JSON.stringify([config.username, config.passwordHash]))
    .update('\0')
    .update(value)
    .digest('base64url');
}

export function createAdminSession(config: AdminConfiguration, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000);
  const payload: SessionPayload = {
    version: 1,
    purpose: 'rozgar-admin',
    issuedAt,
    expiresAt: issuedAt + adminSessionLifetimeSeconds,
    nonce: randomBytes(32).toString('hex'),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const cookie = `${encoded}.${mac('session', encoded, config)}`;
  return { cookie, payload, csrfToken: mac('csrf', cookie, config) };
}

export function readAdminSession(
  cookie: string | undefined,
  config: AdminConfiguration,
  now = Date.now(),
) {
  if (!cookie || cookie.length > 2048) return undefined;
  const match = /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/.exec(cookie);
  if (
    !match?.[1] ||
    !match[2] ||
    !constantTimeTextEqual(match[2], mac('session', match[1], config))
  )
    return undefined;
  try {
    const payload = payloadSchema.parse(
      JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8')),
    );
    const seconds = Math.floor(now / 1000);
    if (
      payload.expiresAt <= seconds ||
      payload.issuedAt > seconds + 30 ||
      payload.expiresAt - payload.issuedAt !== adminSessionLifetimeSeconds
    )
      return undefined;
    return { payload, csrfToken: mac('csrf', cookie, config) };
  } catch {
    return undefined;
  }
}

export function getSessionCookie(header: string | undefined, name: string) {
  const values = (header ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`));
  return values.length === 1 ? values[0]!.slice(name.length + 1) : undefined;
}
