import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { expect, it } from 'vitest';
import { verifyIssuedCv } from '../services/cvIdentity.js';
import { issueCvFile } from './issueCvFile.js';

it('keeps private CLI issuance compatible with the web verifier and refuses overwrites', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'rozgar-admin-cli-test-'));
  if (
    dirname(resolve(directory)) !== resolve(tmpdir()) ||
    !basename(directory).startsWith('rozgar-admin-cli-test-')
  )
    throw new Error('Unexpected test directory.');
  try {
    const input = join(directory, 'test-input.pdf');
    const output = join(directory, 'test-output.pdf');
    const document = await PDFDocument.create();
    document.addPage();
    await writeFile(input, await document.save());
    const secret = randomBytes(32).toString('hex');
    await issueCvFile(input, output, secret, 5 * 1024 * 1024);
    const issued = await readFile(output);
    expect(verifyIssuedCv(issued, secret)?.cvReference).toMatch(/^RL-CV-/);
    await expect(issueCvFile(input, output, secret, 5 * 1024 * 1024)).rejects.toThrow();
    await expect(issueCvFile(input, input, secret, 5 * 1024 * 1024)).rejects.toThrow(/separate/);
    expect(await readFile(output)).toEqual(issued);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 15_000);
