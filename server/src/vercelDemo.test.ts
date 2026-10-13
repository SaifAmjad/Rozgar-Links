import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../api/index.js';

describe('Vercel demo adapter', () => {
  it('serves read-only demo data and rejects application submissions', async () => {
    const [health, config, stats, jobs, submission] = await Promise.all([
      request(app).get('/api/health'),
      request(app).get('/api/config/public'),
      request(app).get('/api/stats'),
      request(app).get('/api/jobs?limit=3'),
      request(app).post('/api/applications'),
    ]);

    expect(health.status).toBe(200);
    expect(config.status).toBe(200);
    expect(config.body.applicationSubmissionEnabled).toBe(false);
    expect(stats.status).toBe(200);
    expect(stats.body.provenance).toBe('estimated');
    expect(jobs.status).toBe(200);
    expect(jobs.body.items).toHaveLength(3);
    expect(jobs.body.items.every((job: { isSample?: unknown }) => job.isSample === true)).toBe(
      true,
    );
    expect(submission.status).toBe(503);
    expect(submission.body.error.code).toBe('demo_submission_disabled');
  });

  it('restores API paths forwarded through the Vercel rewrite', async () => {
    const response = await request(app).get('/api?path=stats');

    expect(response.status).toBe(200);
    expect(response.body.provenance).toBe('estimated');
  });
});
