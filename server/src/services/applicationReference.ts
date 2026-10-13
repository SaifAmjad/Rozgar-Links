import { randomInt } from 'node:crypto';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const recentReferences = new Set<string>();
const maximumRecentReferences = 1_000;

export function createApplicationReference(now = new Date()) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Array.from(
      { length: 6 },
      () => alphabet[randomInt(0, alphabet.length)] ?? 'X',
    ).join('');
    const reference = `RL-${now.getUTCFullYear()}-${suffix}`;
    if (!recentReferences.has(reference)) {
      recentReferences.add(reference);
      if (recentReferences.size > maximumRecentReferences) {
        const oldest = recentReferences.values().next().value;
        if (typeof oldest === 'string') recentReferences.delete(oldest);
      }
      return reference;
    }
  }
  throw new Error('Unable to generate a unique application reference.');
}
