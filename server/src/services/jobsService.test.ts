import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { type JobListing } from '@rozgar-links/shared';

import type { JobProvider } from '../providers/JobProvider.js';
import { JobsRepository } from '../repositories/jobsRepository.js';
import { JobsService, JobsUnavailableError } from './jobsService.js';

const temporaryDirectories: string[] = [];

const sampleJobs: JobListing[] = [
  {
    id: 'sample-001',
    title: 'Warehouse Associate',
    company: 'Example Gateway Logistics',
    country: 'United Arab Emirates',
    city: 'Dubai',
    field: 'logistics',
    source: 'Sample listing',
    sourceUrl: null,
    isSample: true,
    fetchedAt: '2026-10-13T00:00:00.000Z',
  },
  {
    id: 'sample-002',
    title: 'Site Mason',
    company: 'Example Horizon Works',
    country: 'Saudi Arabia',
    city: 'Riyadh',
    field: 'construction',
    source: 'Sample listing',
    sourceUrl: null,
    isSample: true,
    fetchedAt: '2026-10-13T00:00:00.000Z',
  },
  {
    id: 'sample-003',
    title: 'Inventory Clerk',
    company: 'Example Inland Supply',
    country: 'Saudi Arabia',
    city: 'Jeddah',
    field: 'logistics',
    source: 'Sample listing',
    sourceUrl: null,
    isSample: true,
    fetchedAt: '2026-10-13T00:00:00.000Z',
  },
];

async function createService(provider: JobProvider, now: () => Date, cacheTtlMs = 86_400_000) {
  const directory = await mkdtemp(join(tmpdir(), 'rozgar-job-service-'));
  temporaryDirectories.push(directory);
  return new JobsService({
    cacheTtlMs,
    now,
    provider,
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

describe('JobsService', () => {
  it('searches case-insensitively, filters exactly and paginates stably', async () => {
    const provider: JobProvider = {
      descriptor: { id: 'manual', kind: 'sample', label: 'Fictional sample catalog' },
      fetchJobs: vi.fn().mockResolvedValue(sampleJobs),
    };
    const service = await createService(provider, () => new Date('2026-10-13T00:00:00.000Z'));

    const filtered = await service.getJobs({
      country: 'Saudi Arabia',
      field: 'logistics',
      q: 'INVENTORY',
      page: 1,
      limit: 1,
    });

    expect(filtered.items.map((job) => job.id)).toEqual(['sample-003']);
    expect(filtered.total).toBe(1);
    expect(filtered.totalPages).toBe(1);

    const firstPage = await service.getJobs({ page: 1, limit: 2 });
    const secondPage = await service.getJobs({ page: 2, limit: 2 });
    expect(firstPage.items.map((job) => job.title)).toEqual(['Inventory Clerk', 'Site Mason']);
    expect(secondPage.items.map((job) => job.title)).toEqual(['Warehouse Associate']);
  });

  it('returns stale labelled cache when a refresh provider fails', async () => {
    let now = new Date('2026-10-13T00:00:00.000Z');
    const fetchJobs = vi
      .fn()
      .mockResolvedValueOnce(sampleJobs)
      .mockRejectedValue(new Error('down'));
    const provider: JobProvider = {
      descriptor: { id: 'manual', kind: 'sample', label: 'Fictional sample catalog' },
      fetchJobs,
    };
    const service = await createService(provider, () => now, 1_000);

    await service.getJobs({ page: 1, limit: 12 });
    now = new Date('2026-10-13T00:00:02.000Z');
    const stale = await service.getJobs({ page: 1, limit: 12 });

    expect(stale.items).toHaveLength(3);
    expect(stale.provenance.isStale).toBe(true);
    expect(fetchJobs).toHaveBeenCalledTimes(2);
  });

  it('reports unavailable when provider and cache both fail', async () => {
    const provider: JobProvider = {
      descriptor: { id: 'manual', kind: 'sample', label: 'Fictional sample catalog' },
      fetchJobs: vi.fn().mockRejectedValue(new Error('down')),
    };
    const service = await createService(provider, () => new Date('2026-10-13T00:00:00.000Z'));

    await expect(service.getJobs({ page: 1, limit: 12 })).rejects.toBeInstanceOf(
      JobsUnavailableError,
    );
  });
});
