import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app, { restoreForwardedApiPath } from '../../api/index.js';
import { env } from './config/env.js';

describe('Vercel adapter', () => {
  it('serves deployment data and reports the configured submission mode', async () => {
    const [health, config, stats, jobs] = await Promise.all([
      request(app).get('/api/health'),
      request(app).get('/api/config/public'),
      request(app).get('/api/stats'),
      request(app).get('/api/jobs?limit=3'),
    ]);

    expect(health.status).toBe(200);
    expect(config.status).toBe(200);
    expect(config.body.applicationSubmissionEnabled).toBe(env.APPLICATION_SUBMISSION_ENABLED);
    expect(stats.status).toBe(200);
    expect(stats.body.provenance).toBe('estimated');
    expect(jobs.status).toBe(200);
    expect(jobs.body.items).toHaveLength(3);
    expect(jobs.body.items.every((job: { isSample?: unknown }) => job.isSample === true)).toBe(
      true,
    );
  });

  it('restores API paths forwarded through the Vercel rewrite', async () => {
    const [statsResponse, jobsResponse] = await Promise.all([
      request(app).get('/api?path=stats'),
      request(app).get('/api?path=jobs&limit=3'),
    ]);

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.provenance).toBe('estimated');
    expect(jobsResponse.status).toBe(200);
    expect(jobsResponse.body.items).toHaveLength(3);
  });

  it('removes Vercel\'s pre-parsed internal path query', () => {
    const vercelRequest = {
      query: { limit: '3', path: 'jobs' },
      url: '/api?path=jobs&limit=3',
    } as unknown as Parameters<typeof restoreForwardedApiPath>[0];

    restoreForwardedApiPath(vercelRequest);

    expect(vercelRequest.url).toBe('/api/jobs?limit=3');
    expect(vercelRequest.query).toEqual({ limit: '3' });
  });
});
