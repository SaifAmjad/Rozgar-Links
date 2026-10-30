import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { jobsResponseSchema } from '@rozgar-links/shared';

import { ManualProvider } from '../providers/ManualProvider.js';
import { MemoryJobsRepository } from '../repositories/jobsRepository.js';
import { JobsService, JobsUnavailableError } from '../services/jobsService.js';
import { createJobsRouter } from './jobs.js';

function createJobsApp(service: JobsService) {
  const app = express();
  app.use('/api/jobs', createJobsRouter(service));
  return app;
}

function createTestService() {
  return new JobsService({
    now: () => new Date('2026-10-13T00:00:00.000Z'),
    provider: new ManualProvider(),
    repository: new MemoryJobsRepository(),
  });
}

describe('jobs routes', () => {
  it('returns validated bilingual occupations with filtering and pagination metadata', async () => {
    const response = await request(createJobsApp(createTestService())).get(
      '/api/jobs?category=electrical-mep-solar&q=Electrician&page=1&limit=2&language=en',
    );
    const result = jobsResponseSchema.parse(response.body);

    expect(response.status).toBe(200);
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.facets.categories).toHaveLength(9);
    expect(result.facets.designations).toHaveLength(64);
    expect(JSON.stringify(result)).not.toContain('salaryGroup');
  });

  it.each([
    'country=Pakistan',
    'category=unknown',
    'page=0',
    'page=1.5',
    'limit=51',
    'salary=A',
    'customMin=3000&customMax=2000',
    'extra=value',
  ])('rejects invalid query %s', async (query) => {
    const response = await request(createJobsApp(createTestService())).get(`/api/jobs?${query}`);
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_QUERY');
  });

  it('returns a safe 503 response when no directory is available', async () => {
    const service = {
      getJobs: vi.fn().mockRejectedValue(new JobsUnavailableError()),
    } as unknown as JobsService;
    const response = await request(createJobsApp(service)).get('/api/jobs');

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('JOBS_UNAVAILABLE');
  });
});
