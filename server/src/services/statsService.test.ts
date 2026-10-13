import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { StatsRepository } from '../repositories/statsRepository.js';
import { generateStatsSnapshot } from './statsGenerator.js';
import { StatsService, StatsUnavailableError } from './statsService.js';

const temporaryDirectories: string[] = [];

async function createRepository() {
  const directory = await mkdtemp(join(tmpdir(), 'rozgar-service-'));
  temporaryDirectories.push(directory);
  return new StatsRepository(join(directory, 'stats.json'));
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('StatsService', () => {
  it('generates once per configured local date and regenerates after rollover', async () => {
    const repository = await createRepository();
    let now = new Date('2026-01-01T18:59:59.000Z');
    const generate = vi.fn(generateStatsSnapshot);
    const service = new StatsService({
      generate,
      now: () => now,
      repository,
      timeZone: 'Asia/Karachi',
    });

    await service.ensureToday();
    await service.ensureToday();
    expect(generate).toHaveBeenCalledTimes(1);

    now = new Date('2026-01-01T19:00:00.000Z');
    const nextDay = await service.ensureToday();
    expect(nextDay.date).toBe('2026-01-02');
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('returns the last valid snapshot as stale when generation fails', async () => {
    const repository = await createRepository();
    await repository.save(generateStatsSnapshot('2026-10-12', 'Asia/Karachi'));
    const service = new StatsService({
      generate: () => {
        throw new Error('generation failed');
      },
      now: () => new Date('2026-10-13T12:00:00.000Z'),
      repository,
      timeZone: 'Asia/Karachi',
    });

    const result = await service.ensureToday();
    expect(result.date).toBe('2026-10-12');
    expect(result.isStale).toBe(true);
  });

  it('reports unavailable when no valid snapshot or generation exists', async () => {
    const service = new StatsService({
      generate: () => {
        throw new Error('generation failed');
      },
      repository: await createRepository(),
      timeZone: 'Asia/Karachi',
    });

    await expect(service.ensureToday()).rejects.toBeInstanceOf(StatsUnavailableError);
  });
});
