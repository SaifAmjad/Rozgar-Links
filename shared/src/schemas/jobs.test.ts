import { describe, expect, it } from 'vitest';

import { jobListingSchema, jobsResponseSchema } from './jobs.js';

const sampleJob = {
  id: 'sample-001',
  title: 'Site Mason',
  company: 'Example Horizon Works',
  country: 'Saudi Arabia',
  city: 'Riyadh',
  field: 'construction',
  source: 'Sample listing',
  sourceUrl: null,
  isSample: true,
  fetchedAt: '2026-10-13T00:00:00.000Z',
};

describe('job schemas', () => {
  it('accepts an explicitly labelled sample without a source URL', () => {
    expect(jobListingSchema.parse(sampleJob)).toEqual(sampleJob);
  });

  it('rejects source URLs and false source labels on samples', () => {
    expect(() =>
      jobListingSchema.parse({
        ...sampleJob,
        source: 'GulfTalent',
        sourceUrl: 'https://example.com/job',
      }),
    ).toThrow(/sample source label/i);
  });

  it('requires HTTPS original URLs for authorized listings', () => {
    expect(() =>
      jobListingSchema.parse({
        ...sampleJob,
        id: 'authorized-001',
        isSample: false,
        source: 'Authorized feed',
        sourceUrl: null,
      }),
    ).toThrow(/https url/i);
  });

  it('rejects inconsistent pagination metadata', () => {
    expect(() =>
      jobsResponseSchema.parse({
        items: [sampleJob],
        page: 1,
        limit: 12,
        total: 40,
        totalPages: 2,
        lastUpdated: sampleJob.fetchedAt,
        provenance: {
          kind: 'sample',
          source: 'Fictional sample catalog',
          isStale: false,
          notice: 'Fictional samples only.',
        },
      }),
    ).toThrow(/total pages/i);
  });
});
