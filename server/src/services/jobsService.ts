import { jobsResponseSchema, type JobListing, type JobsResponse } from '@rozgar-links/shared';

import type { JobProvider } from '../providers/JobProvider.js';
import {
  JobsRepository,
  type JobsCache,
  type JobsCacheRepository,
} from '../repositories/jobsRepository.js';

const DAY_IN_MS = 86_400_000;

export interface JobsQuery {
  country?: JobListing['country'];
  field?: string;
  limit: number;
  page: number;
  q?: string;
}

interface JobsServiceOptions {
  cacheTtlMs?: number;
  now?: () => Date;
  provider: JobProvider;
  repository?: JobsCacheRepository;
}

export class JobsUnavailableError extends Error {
  constructor() {
    super('No job catalog is currently available.');
    this.name = 'JobsUnavailableError';
  }
}

export class JobsService {
  private readonly cacheTtlMs: number;
  private readonly now: () => Date;
  private readonly repository: JobsCacheRepository;

  constructor({
    cacheTtlMs = DAY_IN_MS,
    now = () => new Date(),
    provider,
    repository = new JobsRepository(),
  }: JobsServiceOptions) {
    this.cacheTtlMs = cacheTtlMs;
    this.now = now;
    this.provider = provider;
    this.repository = repository;
  }

  private readonly provider: JobProvider;

  async refresh(): Promise<JobsCache> {
    try {
      const jobs = await this.provider.fetchJobs();
      const refreshedAt = this.now().toISOString();
      const cache = {
        version: 1 as const,
        provider: this.provider.descriptor,
        refreshedAt,
        jobs,
      };
      await this.repository.save(cache);
      return cache;
    } catch {
      throw new JobsUnavailableError();
    }
  }

  async getJobs(query: JobsQuery): Promise<JobsResponse> {
    const cached = await this.repository.read();
    const refreshedAt = cached.cache ? new Date(cached.cache.refreshedAt).getTime() : 0;
    const isFresh =
      cached.cache !== undefined &&
      !cached.recoveredFromMemory &&
      this.now().getTime() - refreshedAt < this.cacheTtlMs;
    let catalog = cached.cache;
    let isStale = cached.recoveredFromMemory;

    if (!isFresh) {
      try {
        catalog = await this.refresh();
        isStale = false;
      } catch (error) {
        if (!catalog) throw error;
        isStale = true;
      }
    }

    if (!catalog) throw new JobsUnavailableError();

    const searchTerm = query.q?.toLocaleLowerCase('en');
    const filteredJobs = catalog.jobs
      .filter((job) => !query.country || job.country === query.country)
      .filter((job) => !query.field || job.field === query.field)
      .filter((job) => {
        if (!searchTerm) return true;
        return [job.title, job.company, job.city, job.country, job.field].some((value) =>
          value.toLocaleLowerCase('en').includes(searchTerm),
        );
      })
      .sort(
        (left, right) =>
          left.title.localeCompare(right.title, 'en') || left.id.localeCompare(right.id, 'en'),
      );
    const total = filteredJobs.length;
    const start = (query.page - 1) * query.limit;
    const items = filteredJobs.slice(start, start + query.limit);

    return jobsResponseSchema.parse({
      items,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      lastUpdated: catalog.refreshedAt,
      provenance: {
        kind: catalog.provider.kind,
        source: catalog.provider.label,
        isStale,
        notice:
          catalog.provider.kind === 'sample'
            ? 'Fictional sample listings for interface demonstration only.'
            : isStale
              ? 'Authorized source data could not be refreshed; the last valid cache is shown.'
              : 'Authorized source data; follow the original link for current details.',
      },
    });
  }
}
