import { describe, expect, it, vi } from 'vitest';

import type { JobsSort, SalaryBandId } from '@rozgar-links/shared';

import { ManualProvider } from '../providers/ManualProvider.js';
import type { JobProvider } from '../providers/JobProvider.js';
import { MemoryJobsRepository } from '../repositories/jobsRepository.js';
import { JobsService } from './jobsService.js';

const defaults = {
  language: 'en' as const,
  limit: 12,
  page: 1,
  salaryBands: [] as SalaryBandId[],
  sort: 'directory-order' as JobsSort,
};

async function createService() {
  return new JobsService({
    now: () => new Date('2026-10-13T00:00:00.000Z'),
    provider: new ManualProvider(),
    repository: new MemoryJobsRepository(),
  });
}

describe('JobsService', () => {
  it('searches English and Urdu titles with partial matching', async () => {
    const service = await createService();
    const english = await service.getJobs({ ...defaults, q: 'Electrician' });
    const urdu = await service.getJobs({ ...defaults, language: 'ur', q: 'ڈرائیور' });

    expect(english.items.map((item) => item.slug)).toEqual([
      'house-building-electrician',
      'industrial-electrician-panel-wireman',
      'auto-electrician-scanner-tech',
    ]);
    expect(urdu.total).toBeGreaterThanOrEqual(6);
  });

  it('uses internal directory membership for public salary bands without exposing it', async () => {
    const service = await createService();
    const result = await service.getJobs({
      ...defaults,
      limit: 50,
      salaryBands: ['sar-1400-1600'],
    });

    expect(result.total).toBe(6);
    expect(result.items.every((item) => item.salaryMin <= 1450)).toBe(true);
    expect(JSON.stringify(result)).not.toContain('salaryGroup');
  });

  it('combines category and salary filters and supports numeric overlap', async () => {
    const service = await createService();
    const grouped = await service.getJobs({
      ...defaults,
      category: 'construction-civil-trades',
      limit: 50,
      salaryBands: ['sar-1601-2200'],
    });
    const overlap = await service.getJobs({
      ...defaults,
      customMin: 5900,
      customMax: 6500,
      limit: 50,
    });

    expect(grouped.total).toBe(9);
    expect(overlap.items.some((item) => item.slug === 'full-stack-software-engineer')).toBe(true);
  });

  it('filters sample country assignments', async () => {
    const service = await createService();
    const result = await service.getJobs({ ...defaults, country: 'saudi-arabia' });

    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((job) => job.countryIds.includes('saudi-arabia'))).toBe(true);
    expect(result.facets.countries.every((country) => country.enabled && country.count > 0)).toBe(
      true,
    );
  });

  it('returns a stale labelled cache when refresh fails', async () => {
    const catalog = await new ManualProvider().fetchJobs();
    let now = new Date('2026-10-13T00:00:00.000Z');
    const provider: JobProvider = {
      descriptor: {
        id: 'directory',
        kind: 'directory',
        label: 'Occupation directory',
      },
      fetchJobs: vi.fn().mockResolvedValueOnce(catalog).mockRejectedValue(new Error('down')),
    };
    const service = new JobsService({
      cacheTtlMs: 1_000,
      now: () => now,
      provider,
      repository: new MemoryJobsRepository(),
    });

    await service.getJobs(defaults);
    now = new Date('2026-10-13T00:00:02.000Z');
    const stale = await service.getJobs(defaults);

    expect(stale.items).toHaveLength(12);
    expect(stale.provenance.isStale).toBe(true);
  });
});
