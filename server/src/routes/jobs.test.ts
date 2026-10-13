import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { jobsResponseSchema } from '@rozgar-links/shared';

import { ManualProvider } from '../providers/ManualProvider.js';
import { JobsRepository } from '../repositories/jobsRepository.js';
import { JobsService, JobsUnavailableError } from '../services/jobsService.js';
import { createJobsRouter } from './jobs.js';

const temporaryDirectories: string[] = [];

function createJobsApp(service: JobsService) {
  const app = express();
  app.use('/api/jobs', createJobsRouter(service));
  return app;
}

async function createTestService() {
  const directory = await mkdtemp(join(tmpdir(), 'rozgar-job-routes-'));
  temporaryDirectories.push(directory);
  const now = () => new Date('2026-10-13T00:00:00.000Z');
  return new JobsService({
    now,
    provider: new ManualProvider(undefined, now),
    repository: new JobsRepository(join(directory, 'jobs.cache.json')),
  });
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('jobs routes', () => {
  it('returns validated sample listings with filtering and pagination metadata', async () => {
    const response = await request(createJobsApp(await createTestService())).get(
      '/api/jobs?country=Saudi%20Arabia&field=logistics&q=inventory&page=1&limit=1',
    );
    const result = jobsResponseSchema.parse(response.body);

    expect(response.status).toBe(200);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.title).toBe('Inventory Clerk');
    expect(result.items[0]?.sourceUrl).toBeNull();
    expect(result.provenance.kind).toBe('sample');
  });

  it.each(['country=Pakistan', 'field=unknown', 'page=0', 'page=1.5', 'limit=51', 'extra=value'])(
    'rejects invalid query %s',
    async (query) => {
      const response = await request(createJobsApp(await createTestService())).get(
        `/api/jobs?${query}`,
      );

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_QUERY');
    },
  );

  it('returns a safe 503 response when no catalog is available', async () => {
    const service = {
      getJobs: vi.fn().mockRejectedValue(new JobsUnavailableError()),
    } as unknown as JobsService;
    const response = await request(createJobsApp(service)).get('/api/jobs');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'JOBS_UNAVAILABLE',
        message: 'The job catalog is temporarily unavailable.',
      },
    });
  });
});
