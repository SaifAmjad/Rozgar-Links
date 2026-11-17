import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const adminPasswordHashSchema = z
  .string()
  .regex(
    /^scrypt-v1\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{128}$/,
    'Generate a password hash with the admin:password command.',
  );

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export function constantTimeTextEqual(left: string, right: string) {
  return timingSafeEqual(
    createHash('sha256').update(left).digest(),
    createHash('sha256').update(right).digest(),
  );
}

export async function hashAdminPassword(password: string) {
  if (password.length < 14 || password.length > 256)
    throw new Error('Use a password of 14–256 characters.');
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt-v1$32768$8$3$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyAdminPassword(password: string, hash: string) {
  const parsed = adminPasswordHashSchema.safeParse(hash);
  if (!parsed.success || password.length > 256) return false;
  const parts = parsed.data.split('$');
  const key = await derive(password, Buffer.from(parts[4]!, 'hex'));
  const valid = timingSafeEqual(key, Buffer.from(parts[5]!, 'hex'));
  key.fill(0);
  return valid;
}
