import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { generateStatsSnapshot } from '../services/statsGenerator.js';
import { StatsRepository } from './statsRepository.js';

const temporaryDirectories: string[] = [];

async function createRepository() {
  const directory = await mkdtemp(join(tmpdir(), 'rozgar-stats-'));
  temporaryDirectories.push(directory);
  return {
    directory,
    file: join(directory, 'stats.json'),
    repository: new StatsRepository(join(directory, 'stats.json')),
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('StatsRepository', () => {
  it('serializes concurrent saves and leaves no temporary file', async () => {
    const { directory, repository } = await createRepository();
    const first = generateStatsSnapshot('2026-10-12', 'Asia/Karachi');
    const second = generateStatsSnapshot('2026-10-13', 'Asia/Karachi');

    await Promise.all([repository.save(first), repository.save(second)]);

    expect((await repository.findByDate(first.date)).snapshot).toEqual(first);
    expect((await repository.findByDate(second.date)).snapshot).toEqual(second);
    expect((await readdir(directory)).filter((name) => name.endsWith('.tmp'))).toEqual([]);
  });

  it('uses the last valid in-memory snapshot after file corruption', async () => {
    const { file, repository } = await createRepository();
    const snapshot = generateStatsSnapshot('2026-10-13', 'Asia/Karachi');
    await repository.save(snapshot);
    await writeFile(file, '{not-valid-json', 'utf8');

    const recovered = await repository.findLatest();

    expect(recovered.snapshot).toEqual(snapshot);
    expect(recovered.recoveredFromMemory).toBe(true);
  });
});
