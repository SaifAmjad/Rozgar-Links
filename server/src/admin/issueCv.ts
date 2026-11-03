import { readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { env } from '../config/env.js';
import { issueCv } from '../services/cvIssuance.js';

// npm run cv:issue --workspace @rozgar-links/server -- <input.pdf> <output.pdf>
async function main() {
  const [input, output, ...extra] = process.argv.slice(2);
  if (!input || !output || extra.length || !/\.pdf$/i.test(input) || !/\.pdf$/i.test(output)) {
    throw new Error('Usage: cv:issue -- <input.pdf> <new-output.pdf>');
  }
  if (!env.CV_SIGNING_SECRET) throw new Error('Configure the dedicated CV signing key first.');
  if (resolve(input) === resolve(output)) throw new Error('Choose a separate output file.');
  const maximum = Math.min(env.MAX_FILE_MB, 5) * 1024 * 1024;
  if ((await stat(input)).size > maximum)
    throw new Error('The input PDF exceeds the upload limit.');
  const issued = await issueCv(await readFile(input), env.CV_SIGNING_SECRET, maximum);
  await writeFile(output, issued.pdf, { flag: 'wx', mode: 0o600 });
  console.log(
    'Official CV issued successfully. Keep the PDF private and deliver it through your approved process.',
  );
}
main().catch((error: unknown) => {
  // Parser/system errors may include paths or file content. Never print their details.
  if (error instanceof Error && error.message.startsWith('Usage:')) console.error(error.message);
  else
    console.error(
      'CV issuance failed. Check the key, input PDF, size and that the output file does not already exist.',
    );
  process.exitCode = 1;
});
