import { readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { issueCv } from '../services/cvIssuance.js';

export async function issueCvFile(input: string, output: string, secret: string, maximum: number) {
  if (resolve(input) === resolve(output)) throw new Error('Choose a separate output file.');
  if ((await stat(input)).size > maximum)
    throw new Error('The input PDF exceeds the upload limit.');
  const issued = await issueCv(await readFile(input), secret, maximum);
  await writeFile(output, issued.pdf, { flag: 'wx', mode: 0o600 });
}
