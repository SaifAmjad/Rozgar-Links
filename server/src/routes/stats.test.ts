import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { statsHistoryResponseSchema, statsResponseSchema } from '@rozgar-links/shared';

import { StatsRepository } from '../repositories/statsRepository.js';
import { StatsService, StatsUnavailableError } from '../services/statsService.js';
import { createStatsRouter } from './stats.js';

const temporaryDirectories: string[] = [];

async function createTestService() {
  const directory = await mkdtemp(join(tmpdir(), 'rozgar-routes-'));
  temporaryDirectories.push(directory);
  return new StatsService({
    now: () => new Date('2026-10-13T12:00:00.000Z'),
    repository: new StatsRepository(join(directory, 'stats.json')),
    timeZone: 'Asia/Karachi',
  });
}

function createStatsApp(service: StatsService) {
  const app = express();
  app.use('/api/stats', createStatsRouter(service));
  return app;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('stats routes', () => {
  it('returns a validated coherent daily snapshot and bounded history', async () => {
    const app = createStatsApp(await createTestService());
    const statsResponse = await request(app).get('/api/stats');
    const historyResponse = await request(app).get('/api/stats/history?days=7');
    const stats = statsResponseSchema.parse(statsResponse.body);
    const history = statsHistoryResponseSchema.parse(historyResponse.body);

    expect(statsResponse.status).toBe(200);
    expect(historyResponse.status).toBe(200);
    expect(history.entries).toEqual(stats.last7Days);
    expect(stats.provenance).toBe('estimated');
  });

  it.each(['0', '31', '2.5', 'invalid'])('rejects invalid history days %s', async (days) => {
    const app = createStatsApp(await createTestService());
    const response = await request(app).get(`/api/stats/history?days=${days}`);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'INVALID_QUERY',
        message: 'Days must be a whole number from 1 to 30.',
      },
    });
  });

  it('returns a safe 503 response when no valid snapshot is available', async () => {
    const service = {
      ensureToday: vi.fn().mockRejectedValue(new StatsUnavailableError()),
    } as unknown as StatsService;
    const app = createStatsApp(service);

    const response = await request(app).get('/api/stats');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'STATS_UNAVAILABLE',
        message: 'Statistics are temporarily unavailable.',
      },
    });
  });
});
