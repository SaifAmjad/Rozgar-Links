import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { hashAdminPassword } from './password.js';

async function main() {
  if (!process.stdin.isTTY) throw new Error('Run this command in an interactive terminal.');
  // Suppress readline echo so passwords never appear on screen or in shell history.
  const silent = new Writable({
    write(_chunk, _encoding, done) {
      done();
    },
  });
  const prompt = createInterface({ input: process.stdin, output: silent, terminal: true });
  try {
    process.stdout.write('New admin password (14–256 characters, hidden): ');
    const password = await prompt.question('');
    process.stdout.write('\nConfirm password (hidden): ');
    const confirmation = await prompt.question('');
    process.stdout.write('\n');
    if (password !== confirmation) throw new Error('Passwords do not match.');
    const hash = await hashAdminPassword(password);
    console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  } finally {
    prompt.close();
  }
}
main().catch(() => {
  console.error(
    'Password setup failed. Use an interactive terminal, matching passwords, and 14–256 characters.',
  );
  process.exitCode = 1;
});
