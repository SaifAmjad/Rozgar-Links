import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { ManualProvider } from '../providers/ManualProvider.js';
import { JobsRepository } from './jobsRepository.js';

const temporaryDirectories: string[] = [];

async function createRepository() {
  const directory = await mkdtemp(join(tmpdir(), 'rozgar-jobs-'));
  temporaryDirectories.push(directory);
  return {
    directory,
    file: join(directory, 'jobs.cache.json'),
    repository: new JobsRepository(join(directory, 'jobs.cache.json')),
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('JobsRepository', () => {
  it('writes a validated cache atomically', async () => {
    const { directory, repository } = await createRepository();
    const jobs = await new ManualProvider().fetchJobs();
    const cache = {
      version: 1 as const,
      provider: {
        id: 'manual-sample-catalog',
        kind: 'sample' as const,
        label: 'Fictional sample catalog',
      },
      refreshedAt: '2026-10-13T00:00:00.000Z',
      jobs,
    };

    await Promise.all([repository.save(cache), repository.save(cache)]);

    expect((await repository.read()).cache).toEqual(cache);
    expect((await readdir(directory)).filter((name) => name.endsWith('.tmp'))).toEqual([]);
  });

  it('uses the last valid in-memory cache after file corruption', async () => {
    const { file, repository } = await createRepository();
    const jobs = await new ManualProvider().fetchJobs();
    await repository.save({
      version: 1,
      provider: {
        id: 'manual-sample-catalog',
        kind: 'sample',
        label: 'Fictional sample catalog',
      },
      refreshedAt: '2026-10-13T00:00:00.000Z',
      jobs,
    });
    await writeFile(file, '{invalid-json', 'utf8');

    const recovered = await repository.read();
    expect(recovered.cache?.jobs).toHaveLength(40);
    expect(recovered.recoveredFromMemory).toBe(true);
  });
});
