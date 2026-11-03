import { randomBytes } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { issueCv } from './cvIssuance.js';
import { verifyIssuedCv } from './cvIdentity.js';

describe('admin PDF issuance', () => {
  it('adds a visible reference page and produces a readable, verifiable PDF', async () => {
    const document = await PDFDocument.create();
    document.addPage();
    const secret = randomBytes(32).toString('hex');
    const input = Buffer.from(await document.save());
    const result = await issueCv(input, secret);
    expect((await PDFDocument.load(result.pdf)).getPageCount()).toBe(2);
    expect(verifyIssuedCv(result.pdf, secret)).toEqual({ cvReference: result.reference });
    const reSaved = Buffer.from(await (await PDFDocument.load(result.pdf)).save());
    expect(verifyIssuedCv(reSaved, secret)).toBeUndefined();
    await expect(issueCv(result.pdf, secret)).rejects.toThrow(/original unsigned/);
    await expect(issueCv(Buffer.from('not PDF'), secret)).rejects.toThrow();
    await expect(issueCv(input, secret, 100)).rejects.toThrow();
  });
});
