import { describe, expect, it } from 'vitest';

import { ManualProvider } from './ManualProvider.js';
import { ScraperProvider } from './ScraperProvider.js';

describe('job providers', () => {
  it('loads exactly 64 bilingual occupations in nine categories', async () => {
    const catalog = await new ManualProvider().fetchJobs();

    expect(catalog.categories).toHaveLength(9);
    expect(catalog.occupations).toHaveLength(64);
    expect(new Set(catalog.occupations.map((occupation) => occupation.id)).size).toBe(64);
    expect(new Set(catalog.occupations.map((occupation) => occupation.slug)).size).toBe(64);
    expect(new Set(catalog.occupations.flatMap((occupation) => occupation.countryIds)).size).toBe(6);
    expect(catalog.occupations.some((occupation) => occupation.countryIds.length > 1)).toBe(true);
    expect(
      catalog.occupations.every(
        (occupation) =>
          occupation.titleEn.length > 0 &&
          occupation.titleUr.length > 0 &&
          occupation.countryIds.length >= 1 &&
          occupation.countryIds.length <= 3 &&
          new Set(occupation.countryIds).size === occupation.countryIds.length,
      ),
    ).toBe(true);
  });

  it('preserves the Full-Stack Software Engineer open-ended ceiling', async () => {
    const catalog = await new ManualProvider().fetchJobs();
    const occupation = catalog.occupations.find(
      (item) => item.slug === 'full-stack-software-engineer',
    );

    expect(occupation).toMatchObject({
      salaryMin: 4500,
      salaryMax: null,
      salaryMaxOpenEnded: true,
    });
  });

  it('keeps the scraper stub disabled', async () => {
    await expect(new ScraperProvider().fetchJobs()).rejects.toThrow(/disabled pending/i);
  });
});
