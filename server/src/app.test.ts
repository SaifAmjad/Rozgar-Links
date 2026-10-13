import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { jobTaxonomySchema, publicConfigResponseSchema } from '@rozgar-links/shared';

import { createApp } from './app.js';

describe('GET /api/health', () => {
  it('returns a minimal healthy response without implementation details', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});

describe('GET /api/taxonomy', () => {
  it('returns the validated shared taxonomy', async () => {
    const response = await request(createApp()).get('/api/taxonomy');

    expect(response.status).toBe(200);
    expect(jobTaxonomySchema.parse(response.body).fields).toHaveLength(12);
  });
});

describe('GET /api/config/public', () => {
  it('returns only validated demo payment display values and the taxonomy version', async () => {
    const response = await request(createApp()).get('/api/config/public');
    const taxonomyResponse = await request(createApp()).get('/api/taxonomy');
    const config = publicConfigResponseSchema.parse(response.body);
    const serializedConfig = JSON.stringify(config).toLowerCase();

    expect(response.status).toBe(200);
    expect(config.isDemoPayment).toBe(true);
    expect(config.taxonomyVersion).toBe(taxonomyResponse.body.version);
    expect(serializedConfig).not.toContain('smtp');
    expect(serializedConfig).not.toContain('password');
    expect(serializedConfig).not.toContain('secret');
  });
});
