import { env } from '../config/env.js';
import { issueCvFile } from './issueCvFile.js';

// npm run cv:issue --workspace @rozgar-links/server -- <input.pdf> <output.pdf>
async function main() {
  const [input, output, ...extra] = process.argv.slice(2);
  if (!input || !output || extra.length || !/\.pdf$/i.test(input) || !/\.pdf$/i.test(output)) {
    throw new Error('Usage: cv:issue -- <input.pdf> <new-output.pdf>');
  }
  if (!env.CV_SIGNING_SECRET) throw new Error('Configure the dedicated CV signing key first.');
  const maximum = Math.min(env.MAX_FILE_MB, 5) * 1024 * 1024;
  await issueCvFile(input, output, env.CV_SIGNING_SECRET, maximum);
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
