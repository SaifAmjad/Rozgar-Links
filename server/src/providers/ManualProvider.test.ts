import { describe, expect, it } from 'vitest';

import { gccCountryNames, jobTaxonomy } from '@rozgar-links/shared';

import { ManualProvider } from './ManualProvider.js';
import { ScraperProvider } from './ScraperProvider.js';

describe('job providers', () => {
  it('loads 40 honest fictional samples spanning all countries and fields', async () => {
    const jobs = await new ManualProvider(
      undefined,
      () => new Date('2026-10-13T00:00:00.000Z'),
    ).fetchJobs();

    expect(jobs).toHaveLength(40);
    expect(new Set(jobs.map((job) => job.country))).toEqual(new Set(gccCountryNames));
    expect(new Set(jobs.map((job) => job.field))).toEqual(
      new Set(jobTaxonomy.fields.map((field) => field.id)),
    );
    expect(jobs.every((job) => job.isSample)).toBe(true);
    expect(jobs.every((job) => job.source === 'Sample listing')).toBe(true);
    expect(jobs.every((job) => job.sourceUrl === null)).toBe(true);
    expect(JSON.stringify(jobs)).not.toMatch(/gulftalent|naukrigulf/i);
  });

  it('keeps the scraper stub disabled', async () => {
    await expect(new ScraperProvider().fetchJobs()).rejects.toThrow(/disabled pending/i);
  });
});
