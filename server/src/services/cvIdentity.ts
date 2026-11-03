import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { cvReferenceSchema } from '@rozgar-links/shared';
import { env } from '../config/env.js';
import { HttpError } from '../errors/httpError.js';

const marker = Buffer.from('\n%RL-CV-V1:');
const payloadSchema = z
  .object({
    version: z.literal(1),
    purpose: z.literal('rozgar-links-cv'),
    reference: cvReferenceSchema,
    issuedAt: z.string().datetime(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

function signingKey(secret = env.CV_SIGNING_SECRET) {
  if (!secret || !/^[a-fA-F0-9]{64}$/.test(secret)) {
    throw new HttpError(
      503,
      'cv_verification_unavailable',
      'CV verification is not configured. Please try again later.',
    );
  }
  return Buffer.from(secret, 'hex');
}

function signature(payload: string, key: Buffer) {
  return createHmac('sha256', key).update('rozgar-links/cv/v1\0').update(payload).digest();
}

export function createCvReference(now = new Date()) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return `RL-CV-${now.getUTCFullYear()}-${Array.from({ length: 12 }, () => alphabet[randomInt(alphabet.length)]).join('')}`;
}

// The final, exact PDF bytes (including the visible reference page) are hashed BEFORE
// appending this ASCII comment. The verifier accepts only this single terminal envelope.
export function signIssuedCv(pdf: Buffer, reference: string, secret?: string, now = new Date()) {
  const key = signingKey(secret);
  if (pdf.includes(marker)) throw new Error('Reissue from the original unsigned PDF.');
  const payload = payloadSchema.parse({
    version: 1,
    purpose: 'rozgar-links-cv',
    reference,
    issuedAt: now.toISOString(),
    sha256: createHash('sha256').update(pdf).digest('hex'),
  });
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return Buffer.concat([
    pdf,
    marker,
    Buffer.from(`${encoded}.${signature(encoded, key).toString('base64url')}\n`),
  ]);
}

export function verifyIssuedCv(
  pdf: Buffer,
  secret?: string,
  now = new Date(),
): { cvReference: string } | undefined {
  const key = signingKey(secret);
  const start = pdf.lastIndexOf(marker);
  if (start < 0 || pdf.length - start > 1024 || pdf.subarray(0, start).includes(marker))
    return undefined;
  const envelope = pdf.subarray(start + marker.length).toString('utf8');
  const match = /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})\n$/.exec(envelope);
  if (!match?.[1] || !match[2] || match[0].length !== envelope.length) return undefined;
  const supplied = Buffer.from(match[2], 'base64url');
  if (supplied.toString('base64url') !== match[2]) return undefined;
  const expected = signature(match[1], key);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return undefined;
  try {
    const payload = payloadSchema.parse(
      JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8')),
    );
    if (Date.parse(payload.issuedAt) > now.getTime() + 300_000) return undefined;
    if (createHash('sha256').update(pdf.subarray(0, start)).digest('hex') !== payload.sha256)
      return undefined;
    if (
      !pdf.subarray(0, 5).equals(Buffer.from('%PDF-')) ||
      !pdf.subarray(0, start).includes(Buffer.from('%%EOF'))
    )
      return undefined;
    return { cvReference: payload.reference };
  } catch {
    return undefined;
  }
}
