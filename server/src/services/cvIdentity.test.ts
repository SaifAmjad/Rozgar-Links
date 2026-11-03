import { createHmac, randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createCvReference, signIssuedCv, verifyIssuedCv } from './cvIdentity.js';

const secret = randomBytes(32).toString('hex');
const pdf = Buffer.from('%PDF-1.7\nOriginal test CV\n%%EOF\n');
const reference = createCvReference();

describe('issued CV identity and exact-byte integrity', () => {
  it('recognizes an issued document after a byte-preserving copy', () => {
    const issued = signIssuedCv(pdf, reference, secret);
    expect(verifyIssuedCv(Buffer.from(issued), secret)).toEqual({ cvReference: reference });
    expect(reference).toMatch(/^RL-CV-\d{4}-[A-Z2-9]{12}$/);
  });
  it('rejects legacy PDFs, forged tokens, appended content and wrong keys', () => {
    const issued = signIssuedCv(pdf, reference, secret);
    expect(verifyIssuedCv(pdf, secret)).toBeUndefined();
    expect(verifyIssuedCv(Buffer.concat([issued, Buffer.from('extra')]), secret)).toBeUndefined();
    expect(verifyIssuedCv(Buffer.concat([issued, Buffer.from('\n')]), secret)).toBeUndefined();
    expect(verifyIssuedCv(issued, randomBytes(32).toString('hex'))).toBeUndefined();
    const changed = Buffer.from(issued);
    changed[changed.length - 10] ^= 1;
    expect(verifyIssuedCv(changed, secret)).toBeUndefined();
  });
  it('rejects changed PDF bytes and valid tokens copied into different PDFs', () => {
    const issued = signIssuedCv(pdf, reference, secret);
    const changed = Buffer.from(issued);
    changed[15] ^= 1;
    expect(verifyIssuedCv(changed, secret)).toBeUndefined();
    const trailer = issued.subarray(pdf.length);
    expect(
      verifyIssuedCv(
        Buffer.concat([Buffer.from('%PDF-1.7\nDifferent CV\n%%EOF\n'), trailer]),
        secret,
      ),
    ).toBeUndefined();
  });
  it('rejects malformed and unsupported issuance payloads even with a valid HMAC', () => {
    for (const value of [{ version: 2 }, { purpose: 'other' }, { issuedAt: 'invalid' }]) {
      const issued = signIssuedCv(pdf, reference, secret);
      const envelope = issued.subarray(pdf.length).toString().slice('\n%RL-CV-V1:'.length).trim();
      const payload = JSON.parse(Buffer.from(envelope.split('.')[0] ?? '', 'base64url').toString());
      const encoded = Buffer.from(JSON.stringify({ ...payload, ...value })).toString('base64url');
      const signature = createHmac('sha256', Buffer.from(secret, 'hex'))
        .update('rozgar-links/cv/v1\0')
        .update(encoded)
        .digest('base64url');
      expect(
        verifyIssuedCv(
          Buffer.concat([pdf, Buffer.from(`\n%RL-CV-V1:${encoded}.${signature}\n`)]),
          secret,
        ),
      ).toBeUndefined();
    }
  });
  it('fails closed without a dedicated signing key and refuses nested issuance', () => {
    expect(() => verifyIssuedCv(pdf, '')).toThrow(/not configured/);
    expect(() => signIssuedCv(signIssuedCv(pdf, reference, secret), reference, secret)).toThrow(
      /original unsigned/,
    );
  });
});
