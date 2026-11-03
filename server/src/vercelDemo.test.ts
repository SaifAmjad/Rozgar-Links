import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import app, { restoreForwardedApiPath } from '../../api/index.js';
import { env } from './config/env.js';

describe('Vercel adapter', () => {
  it('refreshes a warm function after Karachi midnight without cron or redeployment', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-11-03T18:59:59.000Z'));
      const before = await request(app).get('/api?path=stats');
      vi.setSystemTime(new Date('2026-11-03T19:00:01.000Z'));
      const after = await request(app).get('/api?path=stats');
      expect(before.status).toBe(200);
      expect(after.status).toBe(200);
      expect(before.body.date).toBe('2026-11-03');
      expect(after.body.date).toBe('2026-11-04');
      expect(after.body.totalOpenings).not.toBe(before.body.totalOpenings);
      expect(after.headers['cache-control']).toBe('no-store');
    } finally {
      vi.useRealTimers();
    }
  });
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
    expect(
      jobs.body.items.every(
        (job: { recordType?: unknown }) => job.recordType === 'occupation_directory',
      ),
    ).toBe(true);
    expect(JSON.stringify(jobs.body)).not.toContain('salaryGroup');
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

  it("removes Vercel's pre-parsed internal path query", () => {
    const vercelRequest = {
      query: { limit: '3', path: 'jobs' },
      url: '/api?path=jobs&limit=3',
    } as unknown as Parameters<typeof restoreForwardedApiPath>[0];

    restoreForwardedApiPath(vercelRequest);

    expect(vercelRequest.url).toBe('/api/jobs?limit=3');
    expect(vercelRequest.query).toEqual({ limit: '3' });
  });
});
